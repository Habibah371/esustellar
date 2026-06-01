import { getAllPublicGroups, GroupInfo, SdkConfig } from "../get-all-public-groups";

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
  const mockServer = { simulateTransaction: jest.fn(), ...overrides };
  getSdk().rpc.Server.mockImplementation(() => mockServer);
  return mockServer;
}

const PUBLIC_GROUP = {
  contract_address: "CSAVINGS001",
  group_id: "group-001",
  name: "Public Savings Circle",
  admin: "GADMIN001",
  is_public: true,
  created_at: BigInt(1717200000),
  total_members: 5,
};

const PRIVATE_GROUP = {
  contract_address: "CSAVINGS002",
  group_id: "group-002",
  name: "Private Circle",
  admin: "GADMIN002",
  is_public: false,
  created_at: BigInt(1717200100),
  total_members: 3,
};

describe("getAllPublicGroups", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSdk().rpc.Api.isSimulationError.mockReturnValue(false);
  });

  it("returns only public groups from the registry", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    // Contract filters — only returns public groups
    getSdk().scValToNative.mockReturnValueOnce([PUBLIC_GROUP]);

    const result = await getAllPublicGroups(config);

    expect(result).toHaveLength(1);
    expect(result[0].isPublic).toBe(true);
    expect(result[0].groupId).toBe("group-001");
  });

  it("returns empty array when no public groups are registered", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    getSdk().scValToNative.mockReturnValueOnce([]);

    const result = await getAllPublicGroups(config);

    expect(result).toEqual([]);
  });

  it("private groups are not present in the response (filtered by contract)", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    // The on-chain function only returns public groups; private group absent
    getSdk().scValToNative.mockReturnValueOnce([PUBLIC_GROUP]);

    const result = await getAllPublicGroups(config);

    const privateFound = result.find((g) => !g.isPublic);
    expect(privateFound).toBeUndefined();
  });

  it("maps GroupInfo fields correctly", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    getSdk().scValToNative.mockReturnValueOnce([PUBLIC_GROUP]);

    const [group] = await getAllPublicGroups(config);

    const expected: GroupInfo = {
      contractAddress: "CSAVINGS001",
      groupId: "group-001",
      name: "Public Savings Circle",
      admin: "GADMIN001",
      isPublic: true,
      createdAt: 1717200000,
      totalMembers: 5,
    };
    expect(group).toEqual(expected);
  });

  it("maps multiple public groups correctly", async () => {
    const second = { ...PUBLIC_GROUP, group_id: "group-003", name: "Group 3" };
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    getSdk().scValToNative.mockReturnValueOnce([PUBLIC_GROUP, second]);

    const result = await getAllPublicGroups(config);

    expect(result).toHaveLength(2);
    expect(result.every((g) => g.isPublic)).toBe(true);
  });

  it("calls get_all_public_groups on the contract", async () => {
    const { Contract } = getSdk();
    const mockCall = jest.fn().mockReturnValue("mock-op");
    Contract.mockImplementationOnce(() => ({ call: mockCall }));
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({
      result: { retval: "mock-retval" },
    });
    getSdk().scValToNative.mockReturnValueOnce([]);

    await getAllPublicGroups(config);

    expect(Contract).toHaveBeenCalledWith(config.contractId);
    expect(mockCall).toHaveBeenCalledWith("get_all_public_groups");
  });

  it("throws on simulation error", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({ error: "OutOfGas" });
    getSdk().rpc.Api.isSimulationError.mockReturnValueOnce(true);

    await expect(getAllPublicGroups(config)).rejects.toThrow(
      "Registry contract simulation error: OutOfGas",
    );
  });

  it("throws when simulation result is empty", async () => {
    const mockServer = makeMockServer();
    mockServer.simulateTransaction.mockResolvedValueOnce({ result: null });

    await expect(getAllPublicGroups(config)).rejects.toThrow(
      "Simulation returned empty result",
    );
  });
});
