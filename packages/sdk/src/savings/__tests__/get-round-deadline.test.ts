import { getRoundDeadline, SdkConfig } from "../get-round-deadline";

jest.mock("@stellar/stellar-sdk", () => {
  const TransactionBuilderMock: any = jest.fn().mockImplementation(() => ({
    addOperation: jest.fn().mockReturnThis(),
    setTimeout: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({ toXDR: jest.fn().mockReturnValue("mock-xdr") }),
  }));

  return {
    Contract: jest.fn().mockImplementation(() => ({
      call: jest.fn().mockReturnValue("mock-op"),
    })),
    Account: jest.fn().mockImplementation(() => ({})),
    BASE_FEE: "100",
    TransactionBuilder: TransactionBuilderMock,
    rpc: {
      Server: jest.fn(),
      Api: {
        isSimulationError: jest.fn(),
        GetTransactionStatus: { NOT_FOUND: "NOT_FOUND", SUCCESS: "SUCCESS" },
      },
    },
    scValToNative: jest.fn(),
    nativeToScVal: jest.fn().mockReturnValue("mock-scval"),
  };
});

const config: SdkConfig = {
  contractId: "CSAVINGSCONTRACTID00000000000000000000000000000000000",
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
};

function getSdk() {
  return jest.requireMock("@stellar/stellar-sdk") as any;
}

function makeMockServer(overrides: Record<string, jest.Mock> = {}) {
  const mockServer = { simulateTransaction: jest.fn(), ...overrides };
  getSdk().rpc.Server.mockImplementation(() => mockServer);
  return mockServer;
}

describe("getRoundDeadline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSdk().rpc.Api.isSimulationError.mockReturnValue(false);
  });

  it("returns deadline timestamp for a valid round", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({ result: { retval: "mock-retval" } });
    getSdk().scValToNative.mockReturnValueOnce(BigInt(1717200000));

    const ts = await getRoundDeadline(config, "ajo-001", 1);

    expect(ts).toBe(1717200000);
  });

  it("passes group_id and round as ScVals and calls the correct contract method", async () => {
    const { nativeToScVal, Contract } = getSdk();
    const mockCall = jest.fn().mockReturnValue("mock-op");
    Contract.mockImplementationOnce(() => ({ call: mockCall }));
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({ result: { retval: "mock-retval" } });
    getSdk().scValToNative.mockReturnValueOnce(123n);

    await getRoundDeadline(config, "ajo-001", 2);

    expect(nativeToScVal).toHaveBeenCalledWith("ajo-001", { type: "string" });
    expect(nativeToScVal).toHaveBeenCalledWith(2, { type: "u32" });
    expect(mockCall).toHaveBeenCalledWith("get_round_deadline", expect.anything(), expect.anything());
  });

  it("throws GroupNotFound when the round is out of range", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({ error: "contract error: group not found" });
    getSdk().rpc.Api.isSimulationError.mockReturnValueOnce(true);

    await expect(getRoundDeadline(config, "ajo-001", 999)).rejects.toThrow("GroupNotFound");
  });
});
