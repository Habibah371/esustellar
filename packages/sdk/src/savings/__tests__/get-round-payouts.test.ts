import { getRoundPayouts, Payout, SdkConfig } from "../get-round-payouts";

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

describe("getRoundPayouts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSdk().rpc.Api.isSimulationError.mockReturnValue(false);
  });

  it("returns mapped payouts for a round", async () => {
    const mockServer = makeMockServer();
    const rawPayout: Payout = {
      recipient: "GRECIPIENT000000000000000000000000000000000000000000",
      amount: 50000000n,
      round: 1,
      timestamp: 1717200000n,
    } as any;

    mockServer.simulateTransaction.mockResolvedValueOnce({ result: { retval: "mock-retval" } });
    getSdk().scValToNative.mockReturnValueOnce([rawPayout]);

    const payouts = await getRoundPayouts(config, "ajo-001", 1);

    expect(payouts).toHaveLength(1);
    expect(payouts[0]).toEqual({
      recipient: rawPayout.recipient,
      amount: BigInt(50000000),
      round: 1,
      timestamp: BigInt(1717200000),
    });
  });

  it("throws GroupNotFound when the round is out of range (no payouts yet)", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({ error: "contract error: group not found" });
    getSdk().rpc.Api.isSimulationError.mockReturnValueOnce(true);

    await expect(getRoundPayouts(config, "ajo-001", 999)).rejects.toThrow("GroupNotFound");
  });
});
