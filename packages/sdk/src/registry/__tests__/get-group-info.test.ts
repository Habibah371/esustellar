import { getGroupInfo, GroupInfo, SdkConfig } from "../get-group-info";

jest.mock("@stellar/stellar-sdk", () => {
  const TransactionBuilderMock: any = jest.fn().mockImplementation(() => ({
    addOperation: jest.fn().mockReturnThis(),
    setTimeout: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({ toXDR: jest.fn().mockReturnValue("mock-xdr") }),
  }));
  TransactionBuilderMock.fromXDR = jest.fn();

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
  contractId: "CREGISTRYCONTRACTID000000000000000000000000000000000000",
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
};

const CONTRACT_ADDRESS = "CSAVINGSCONTRACTID00000000000000000000000000000000000";

function getSdk() {
  return jest.requireMock("@stellar/stellar-sdk") as any;
}

function makeMockServer(overrides: Record<string, jest.Mock> = {}) {
  const mockServer = { simulateTransaction: jest.fn(), ...overrides };
  getSdk().rpc.Server.mockImplementation(() => mockServer);
  return mockServer;
}

const RAW_GROUP_INFO = {
  contract_address: CONTRACT_ADDRESS,
  group_id: "ajo-001",
  name: "Lagos Ajo Circle",
  admin: "GADMIN000000000000000000000000000000000000000000000000",
  is_public: true,
  created_at: BigInt(1717200000),
  total_members: 6,
};

const EXPECTED: GroupInfo = {
  contractAddress: CONTRACT_ADDRESS,
  groupId: "ajo-001",
  name: "Lagos Ajo Circle",
  admin: "GADMIN000000000000000000000000000000000000000000000000",
  isPublic: true,
  createdAt: 1717200000,
  totalMembers: 6,
};

describe("getGroupInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSdk().rpc.Api.isSimulationError.mockReturnValue(false);
  });

  it("returns mapped GroupInfo for a registered group", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    getSdk().scValToNative.mockReturnValueOnce(RAW_GROUP_INFO);

    const result = await getGroupInfo(config, CONTRACT_ADDRESS);

    expect(result).toEqual(EXPECTED);
  });

  it("passes the contract address as an address ScVal", async () => {
    const { nativeToScVal, Contract } = getSdk();
    const mockCall = jest.fn().mockReturnValue("mock-op");
    Contract.mockImplementationOnce(() => ({ call: mockCall }));
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    getSdk().scValToNative.mockReturnValueOnce(RAW_GROUP_INFO);

    await getGroupInfo(config, CONTRACT_ADDRESS);

    expect(nativeToScVal).toHaveBeenCalledWith(CONTRACT_ADDRESS, { type: "address" });
    expect(mockCall).toHaveBeenCalledWith("get_group_info", expect.anything());
  });

  it("maps a private group correctly", async () => {
    const privateRaw = { ...RAW_GROUP_INFO, is_public: false };
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    getSdk().scValToNative.mockReturnValueOnce(privateRaw);

    const result = await getGroupInfo(config, CONTRACT_ADDRESS);

    expect(result.isPublic).toBe(false);
  });

  it("throws GroupNotFound when the simulation error contains error code #2", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      error: "HostError: Error(Contract, #2)",
    });
    getSdk().rpc.Api.isSimulationError.mockReturnValueOnce(true);

    await expect(getGroupInfo(config, "CNONEXISTENT")).rejects.toThrow(
      "GroupNotFound: no group registered at CNONEXISTENT",
    );
  });

  it("throws GroupNotFound when the simulation error says not found", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      error: "contract error: group not found",
    });
    getSdk().rpc.Api.isSimulationError.mockReturnValueOnce(true);

    await expect(getGroupInfo(config, "CNONEXISTENT")).rejects.toThrow(
      "GroupNotFound",
    );
  });

  it("throws a generic error for non-GroupNotFound simulation errors", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({ error: "OutOfGas" });
    getSdk().rpc.Api.isSimulationError.mockReturnValueOnce(true);

    await expect(getGroupInfo(config, CONTRACT_ADDRESS)).rejects.toThrow(
      "Registry contract simulation error: OutOfGas",
    );
  });

  it("throws when simulation result is empty", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({ result: null });

    await expect(getGroupInfo(config, CONTRACT_ADDRESS)).rejects.toThrow(
      "Simulation returned empty result",
    );
  });

  it("uses the provided sourceAccount", async () => {
    const { Account } = getSdk();
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    getSdk().scValToNative.mockReturnValueOnce(RAW_GROUP_INFO);

    await getGroupInfo({ ...config, sourceAccount: "GCUSTOM" }, CONTRACT_ADDRESS);

    expect(Account).toHaveBeenCalledWith("GCUSTOM", "0");
  });
});
