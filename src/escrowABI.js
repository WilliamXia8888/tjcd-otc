const escrowABI = [
  "function tjcdToken() view returns (address)",
  "function tradeCounter() view returns (uint256)",
  "function trades(uint256) view returns (address seller, address buyer, uint256 amount, uint256 tradeId, bool isReleased, bool isCancelled)",
  "function createTrade(address _buyer, uint256 _amount) returns (uint256)",
  "function releaseTrade(uint256 _tradeId)",
  "function cancelTrade(uint256 _tradeId)",
  "function resolveDispute(uint256 _tradeId, address _recipient)",
  "event TradeCreated(uint256 indexed tradeId, address indexed seller, address indexed buyer, uint256 amount)",
  "event TradeReleased(uint256 indexed tradeId)",
  "event TradeCancelled(uint256 indexed tradeId)"
];

export default escrowABI;