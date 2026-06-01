import { contribute, WriteConfig } from "../contribute";

jest.mock("@stellar/stellar-sdk", () => {
  const TransactionBuilderMock: any = jest.fn().mockImplementation(() => ({
    addOperation: jest.fn().mockReturnThis(),
    setTimeout: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({
      toXDR: jest.fn().mockReturnValue("built-xdr"),
    }),
  }));
  TransactionBuilderMock.fromXDR = jest.fn().mockReturnValue("prepared-tx-obj");

  return {
    Contract: jest.fn().mockImplementation(() => ({
      call: jest.fn().mockReturnValue("mock-op"),
    })),
    BASE_FEE: "100",
    TransactionBuilder: TransactionBuilderMock,
    rpc: {
      Server: jest.fn(),
      Api: {
        isSimulationError: jest.fn(),
        GetTransactionStatus: { NOT_FOUND: "NOT_FOUND", SUCCESS: "SUCCESS" },
      },
    },
    nativeToScVal: jest.fn().mockReturnValue("mock-scval"),
  };
});

function getSdk() {
  return jest.requireMock("@stellar/stellar-sdk") as any;
}

function makeMockServer(overrides: Record<string, jest.Mock> = {}) {
  const mockServer = {
    getAccount: jest.fn().mockResolvedValue({ id: "GPUBKEY", sequence: "100" }),
    prepareTransaction: jest.fn().mockResolvedValue({
      toXDR: jest.fn().mockReturnValue("prepared-xdr"),
    }),
    sendTransaction: jest.fn().mockResolvedValue({ status: "PENDING", hash: "txhash123" }),
    getTransaction: jest.fn().mockResolvedValue({ status: "SUCCESS" }),
    ...overrides,
  };
  getSdk().rpc.Server.mockImplementation(() => mockServer);
  return mockServer;
}

const signTransaction = jest.fn().mockResolvedValue("signed-xdr");

const config: WriteConfig = {
  contractId: "CSAVINGSCONTRACTID00000000000000000000000000000000000",
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  publicKey: "GMEMBER000000000000000000000000000000000000000000000000",
  signTransaction,
};

const GROUP_ID = "ajo-001";

describe("contribute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    signTransaction.mockResolvedValue("signed-xdr");
  });

  it("returns the successful transaction response on a valid contribution", async () => {
    const mockServer = makeMockServer();

    const result = await contribute(config, GROUP_ID);

    expect(result).toEqual({ status: "SUCCESS" });
    expect(mockServer.sendTransaction).toHaveBeenCalledTimes(1);
    expect(mockServer.getTransaction).toHaveBeenCalledWith("txhash123");
  });

  it("calls contribute with member address and group_id (no amount param)", async () => {
    const { Contract, nativeToScVal } = getSdk();
    const mockCall = jest.fn().mockReturnValue("mock-op");
    Contract.mockImplementationOnce(() => ({ call: mockCall }));
    makeMockServer();

    await contribute(config, GROUP_ID);

    expect(mockCall).toHaveBeenCalledWith(
      "contribute",
      expect.anything(), // member
      expect.anything(), // group_id
    );
    // Exactly two nativeToScVal calls — no amount
    expect(nativeToScVal).toHaveBeenCalledWith(config.publicKey, { type: "address" });
    expect(nativeToScVal).toHaveBeenCalledWith(GROUP_ID, { type: "string" });
    expect(nativeToScVal).not.toHaveBeenCalledWith(expect.anything(), { type: "i128" });
  });

  it("passes the signed XDR to fromXDR", async () => {
    makeMockServer();
    const { TransactionBuilder } = getSdk();

    await contribute(config, GROUP_ID);

    expect(signTransaction).toHaveBeenCalledWith("prepared-xdr");
    expect(TransactionBuilder.fromXDR).toHaveBeenCalledWith(
      "signed-xdr",
      config.networkPassphrase,
    );
  });

  it("throws GroupNotFound when the group does not exist", async () => {
    makeMockServer({
      prepareTransaction: jest.fn().mockRejectedValueOnce(
        new Error("HostError: Error(Contract, #4)"),
      ),
    });

    await expect(contribute(config, "nonexistent-group")).rejects.toThrow(
      "HostError: Error(Contract, #4)",
    );
  });

  it("throws GroupNotActive when the group has not started or has completed", async () => {
    makeMockServer({
      prepareTransaction: jest.fn().mockRejectedValueOnce(
        new Error("HostError: Error(Contract, #8)"),
      ),
    });

    await expect(contribute(config, GROUP_ID)).rejects.toThrow(
      "HostError: Error(Contract, #8)",
    );
  });

  it("throws NotMember when caller is not in the group", async () => {
    makeMockServer({
      prepareTransaction: jest.fn().mockRejectedValueOnce(
        new Error("HostError: Error(Contract, #9)"),
      ),
    });

    await expect(contribute(config, GROUP_ID)).rejects.toThrow(
      "HostError: Error(Contract, #9)",
    );
  });

  it("throws MemberDefaulted when the caller has defaulted", async () => {
    makeMockServer({
      prepareTransaction: jest.fn().mockRejectedValueOnce(
        new Error("HostError: Error(Contract, #10)"),
      ),
    });

    await expect(contribute(config, GROUP_ID)).rejects.toThrow(
      "HostError: Error(Contract, #10)",
    );
  });

  it("throws AlreadyPaidThisRound on a double-pay attempt", async () => {
    makeMockServer({
      prepareTransaction: jest.fn().mockRejectedValueOnce(
        new Error("HostError: Error(Contract, #11)"),
      ),
    });

    await expect(contribute(config, GROUP_ID)).rejects.toThrow(
      "HostError: Error(Contract, #11)",
    );
  });

  it("throws PaymentWindowClosed when the round grace period has expired", async () => {
    makeMockServer({
      prepareTransaction: jest.fn().mockRejectedValueOnce(
        new Error("HostError: Error(Contract, #12)"),
      ),
    });

    await expect(contribute(config, GROUP_ID)).rejects.toThrow(
      "HostError: Error(Contract, #12)",
    );
  });

  it("throws when the network does not accept the transaction", async () => {
    makeMockServer({
      sendTransaction: jest.fn().mockResolvedValueOnce({ status: "ERROR", hash: "h" }),
    });

    await expect(contribute(config, GROUP_ID)).rejects.toThrow(
      "Transaction not accepted by network: ERROR",
    );
  });

  it("throws when the confirmed transaction has a FAILED status", async () => {
    makeMockServer({
      getTransaction: jest.fn().mockResolvedValueOnce({ status: "FAILED" }),
    });

    await expect(contribute(config, GROUP_ID)).rejects.toThrow(
      "contribute transaction failed: FAILED",
    );
  });

  it("polls until getTransaction leaves NOT_FOUND", async () => {
    const getTransaction = jest
      .fn()
      .mockResolvedValueOnce({ status: "NOT_FOUND" })
      .mockResolvedValueOnce({ status: "SUCCESS" });

    makeMockServer({ getTransaction });

    jest.useFakeTimers();
    const promise = contribute(config, GROUP_ID);
    await jest.runAllTimersAsync();
    const result = await promise;
    jest.useRealTimers();

    expect(getTransaction).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ status: "SUCCESS" });
  });
});
