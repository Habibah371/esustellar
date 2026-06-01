import { getAllGroupsInfo, GroupInfo, SdkConfig } from "../get-all-groups-info";

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

function getSdk() {
  return jest.requireMock("@stellar/stellar-sdk") as any;
}

function makeMockServer(overrides: Record<string, jest.Mock> = {}) {
  const mockServer = {
    simulateTransaction: jest.fn(),
    ...overrides,
  };
  getSdk().rpc.Server.mockImplementation(() => mockServer);
  return mockServer;
}

const RAW_GROUP = {
  contract_address: "CSAVINGSADDR000000000000000000000000000000000000000000",
  group_id: "group-001",
  name: "Test Savings Group",
  admin: "GADMIN0000000000000000000000000000000000000000000000000",
  is_public: true,
  created_at: BigInt(1717200000),
  total_members: 5,
};

const EXPECTED_GROUP: GroupInfo = {
  contractAddress: "CSAVINGSADDR000000000000000000000000000000000000000000",
  groupId: "group-001",
  name: "Test Savings Group",
  admin: "GADMIN0000000000000000000000000000000000000000000000000",
  isPublic: true,
  createdAt: 1717200000,
  totalMembers: 5,
};

describe("getAllGroupsInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSdk().rpc.Api.isSimulationError.mockReturnValue(false);
  });

  it("returns mapped GroupInfo array matching registered data", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    getSdk().scValToNative.mockReturnValueOnce([RAW_GROUP]);

    const result = await getAllGroupsInfo(config);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(EXPECTED_GROUP);
  });

  it("returns an empty array when no groups are registered", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    getSdk().scValToNative.mockReturnValueOnce([]);

    const result = await getAllGroupsInfo(config);

    expect(result).toEqual([]);
  });

  it("maps multiple groups correctly", async () => {
    const second = { ...RAW_GROUP, group_id: "group-002", name: "Group 2", is_public: false };
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    getSdk().scValToNative.mockReturnValueOnce([RAW_GROUP, second]);

    const result = await getAllGroupsInfo(config);

    expect(result).toHaveLength(2);
    expect(result[1].groupId).toBe("group-002");
    expect(result[1].isPublic).toBe(false);
  });

  it("uses the provided sourceAccount in the simulation", async () => {
    const { Account } = getSdk();
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    getSdk().scValToNative.mockReturnValueOnce([]);

    await getAllGroupsInfo({ ...config, sourceAccount: "GCUSTOM_ACCOUNT" });

    expect(Account).toHaveBeenCalledWith("GCUSTOM_ACCOUNT", "0");
  });

  it("falls back to the dummy account when sourceAccount is omitted", async () => {
    const { Account } = getSdk();
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    getSdk().scValToNative.mockReturnValueOnce([]);

    await getAllGroupsInfo(config);

    expect(Account).toHaveBeenCalledWith(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      "0",
    );
  });

  it("throws when the simulation returns an error", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({ error: "HostError: OutOfGas" });
    getSdk().rpc.Api.isSimulationError.mockReturnValueOnce(true);

    await expect(getAllGroupsInfo(config)).rejects.toThrow(
      "Registry contract simulation error: HostError: OutOfGas",
    );
  });

  it("throws when simulation result is empty", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({ result: null });

    await expect(getAllGroupsInfo(config)).rejects.toThrow(
      "Simulation returned empty result",
    );
  });

  it("invokes get_all_groups_info on the correct contract", async () => {
    const { Contract } = getSdk();
    const mockCallReturn = "mock-op-call";
    const mockContractInstance = { call: jest.fn().mockReturnValue(mockCallReturn) };
    Contract.mockImplementationOnce(() => mockContractInstance);

    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    getSdk().scValToNative.mockReturnValueOnce([]);

    await getAllGroupsInfo(config);

    expect(Contract).toHaveBeenCalledWith(config.contractId);
    expect(mockContractInstance.call).toHaveBeenCalledWith("get_all_groups_info");
  });
});
