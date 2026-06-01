import { createGroup, WriteConfig, CreateGroupParams } from "../create-group";

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
    xdr: {
      ScVal: {
        scvVec: jest.fn().mockReturnValue("mock-scvec"),
        scvSymbol: jest.fn().mockReturnValue("mock-symbol"),
      },
    },
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
  publicKey: "GADMIN0000000000000000000000000000000000000000000000000",
  signTransaction,
};

const validParams: CreateGroupParams = {
  admin: "GADMIN0000000000000000000000000000000000000000000000000",
  groupId: "ajo-001",
  name: "Lagos Ajo Circle",
  contributionAmount: 50_000_000n,
  totalMembers: 6,
  frequency: "Monthly",
  startTimestamp: BigInt(Math.floor(Date.now() / 1000) + 86400),
  isPublic: true,
};

describe("createGroup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    signTransaction.mockResolvedValue("signed-xdr");
  });

  it("returns the successful transaction response on valid input", async () => {
    const mockServer = makeMockServer();

    const result = await createGroup(config, validParams);

    expect(result).toEqual({ status: "SUCCESS" });
    expect(mockServer.sendTransaction).toHaveBeenCalledTimes(1);
    expect(mockServer.getTransaction).toHaveBeenCalledWith("txhash123");
  });

  it("passes the signed XDR to fromXDR and submits the prepared transaction", async () => {
    makeMockServer();
    const { TransactionBuilder } = getSdk();

    await createGroup(config, validParams);

    expect(signTransaction).toHaveBeenCalledWith("prepared-xdr");
    expect(TransactionBuilder.fromXDR).toHaveBeenCalledWith(
      "signed-xdr",
      config.networkPassphrase,
    );
  });

  it("calls create_group with all required parameters", async () => {
    const { Contract, nativeToScVal, xdr } = getSdk();
    const mockCall = jest.fn().mockReturnValue("mock-op");
    Contract.mockImplementationOnce(() => ({ call: mockCall }));
    makeMockServer();

    await createGroup(config, validParams);

    expect(mockCall).toHaveBeenCalledWith(
      "create_group",
      expect.anything(), // admin
      expect.anything(), // groupId
      expect.anything(), // name
      expect.anything(), // contributionAmount
      expect.anything(), // totalMembers
      expect.anything(), // frequency (scvVec)
      expect.anything(), // startTimestamp
      expect.anything(), // isPublic
    );
    expect(nativeToScVal).toHaveBeenCalledWith(validParams.admin, { type: "address" });
    expect(nativeToScVal).toHaveBeenCalledWith(validParams.groupId, { type: "string" });
    expect(nativeToScVal).toHaveBeenCalledWith(validParams.contributionAmount, { type: "i128" });
    expect(nativeToScVal).toHaveBeenCalledWith(validParams.totalMembers, { type: "u32" });
    expect(nativeToScVal).toHaveBeenCalledWith(validParams.startTimestamp, { type: "u64" });
    expect(nativeToScVal).toHaveBeenCalledWith(validParams.isPublic, { type: "bool" });
    expect(xdr.ScVal.scvSymbol).toHaveBeenCalledWith(validParams.frequency);
  });

  it("throws ContributionTooLow when prepareTransaction rejects with that error", async () => {
    makeMockServer({
      prepareTransaction: jest.fn().mockRejectedValueOnce(
        new Error("HostError: Error(Contract, #1)"),
      ),
    });

    await expect(createGroup(config, { ...validParams, contributionAmount: 100n })).rejects.toThrow(
      "HostError: Error(Contract, #1)",
    );
  });

  it("throws InvalidMemberCount when prepareTransaction rejects with that error", async () => {
    makeMockServer({
      prepareTransaction: jest.fn().mockRejectedValueOnce(
        new Error("HostError: Error(Contract, #2)"),
      ),
    });

    await expect(createGroup(config, { ...validParams, totalMembers: 2 })).rejects.toThrow(
      "HostError: Error(Contract, #2)",
    );
  });

  it("throws StartDateMustBeFuture when prepareTransaction rejects with that error", async () => {
    makeMockServer({
      prepareTransaction: jest.fn().mockRejectedValueOnce(
        new Error("HostError: Error(Contract, #3)"),
      ),
    });

    await expect(
      createGroup(config, { ...validParams, startTimestamp: 1000n }),
    ).rejects.toThrow("HostError: Error(Contract, #3)");
  });

  it("throws when the network does not accept the transaction (non-PENDING status)", async () => {
    makeMockServer({
      sendTransaction: jest.fn().mockResolvedValueOnce({ status: "ERROR", hash: "txhash123" }),
    });

    await expect(createGroup(config, validParams)).rejects.toThrow(
      "Transaction not accepted by network: ERROR",
    );
  });

  it("throws when the confirmed transaction has a FAILED status", async () => {
    makeMockServer({
      getTransaction: jest.fn().mockResolvedValueOnce({ status: "FAILED" }),
    });

    await expect(createGroup(config, validParams)).rejects.toThrow(
      "create_group transaction failed: FAILED",
    );
  });

  it("polls getTransaction until it leaves NOT_FOUND state", async () => {
    const getTransaction = jest
      .fn()
      .mockResolvedValueOnce({ status: "NOT_FOUND" })
      .mockResolvedValueOnce({ status: "SUCCESS" });

    makeMockServer({ getTransaction });

    jest.useFakeTimers();
    const promise = createGroup(config, validParams);
    // Advance past the 1s poll delay twice to let the while loop resolve
    await jest.runAllTimersAsync();
    const result = await promise;
    jest.useRealTimers();

    expect(getTransaction).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ status: "SUCCESS" });
  });
});
