import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import './responsive.css';
import { Container, Typography, Button, CircularProgress, TextField, Card, CardContent, CardActions, ThemeProvider, createTheme, useMediaQuery, Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import tokenABI from './tokenABI';
import escrowABI from './escrowABI';
import OwnerPanel from './components/OwnerPanel';
import BuyerPanel from './components/BuyerPanel';

// 创建响应式主题
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 500,
      fontSize: '1.5rem',
      '@media (max-width:600px)': {
        fontSize: '1.2rem',
      },
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.25rem',
      '@media (max-width:600px)': {
        fontSize: '1.1rem',
      },
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingTop: '20px',
          paddingBottom: '20px',
          '@media (max-width:600px)': {
            padding: '16px 8px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          margin: '8px 0',
        },
      },
    },
  },
});

function App() {
  const [loading, setLoading] = useState(false);
  // 确保所有状态变量都有初始值
  const [account, setAccount] = useState(null); // 确保这些状态变量都有初始值
  const [balance, setBalance] = useState(null);
  const [provider, setProvider] = useState(null);
  // Option 1: Remove these lines completely
  // const [signer, setSigner] = useState(null);
  
  // Option 2: Or use it properly by uncommenting setSigner call
  // const signer = provider.getSigner();
  // setSigner(signer);
  const [tokenContract, setTokenContract] = useState(null);
  const [escrowContract, setEscrowContract] = useState(null);
  const [buyerAddress, setBuyerAddress] = useState('');
  const [tradeAmount, setTradeAmount] = useState('');
  const [trades, setTrades] = useState([]);
  const [allowance, setAllowance] = useState('0');
  
  // 添加TJCD兑换价格相关状态
  const [exchangeRate, setExchangeRate] = useState('0'); // TJCD兑换BNB的价格
  const [usdtExchangeRate, setUsdtExchangeRate] = useState('0'); // TJCD兑换USDT的价格
  const [isOwner, setIsOwner] = useState(false); // 是否是TJCD所有者
  const [paymentMethod, setPaymentMethod] = useState('bnb'); // 支付方式：bnb, usdt, other
  const [otherPaymentInfo, setOtherPaymentInfo] = useState(''); // 其他支付方式信息
  
  // USDT合约地址（币安智能链上的USDT）
  const usdtAddress = "0x55d398326f99059fF775485246999027B3197955"; // BSC上的USDT地址
  const [usdtContract, setUsdtContract] = useState(null);
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [usdtAllowance, setUsdtAllowance] = useState('0');
  
  // 指定的收款钱包地址
  const receiverAddress = "0x44Ddfb309F65FF9Bd053271fAAEBA46F71204d6d";

  // 添加地址验证函数
  const validateAddress = (address) => {
    return ethers.utils.isAddress(address);
  };
  
  // 在地址输入框的 onChange 处理函数中
  const handleBuyerAddressChange = (e) => {
    const address = e.target.value;
    setBuyerAddress(address);
  };

  const tokenAddress = "0xf8798a4b7b2560d2e5627abd1a13a0a02899a3be";
  // 替换为您部署的托管合约地址
  const escrowAddress = "0x10773dAdA1467A7dCbED91411213033498a41F3F"; // 将此处替换为您在 Remix 中部署的合约地址

  // 添加 BNB 余额检查
  const [bnbBalance, setBnbBalance] = useState(null);
  
  // 定义 updateBalanceAndAllowance 函数
  const updateBalanceAndAllowance = async (address, tokenContract, escrowContract) => {
    if (tokenContract && provider) {
      try {
        const balance = await tokenContract.balanceOf(address);
        setBalance(ethers.utils.formatUnits(balance, 18));
        
        if (escrowContract) {
          const allowance = await tokenContract.allowance(address, escrowAddress);
          setAllowance(ethers.utils.formatUnits(allowance, 18));
        }
        
        // 获取 BNB 余额
        const bnbBalance = await provider.getBalance(address);
        setBnbBalance(ethers.utils.formatEther(bnbBalance));
        
        // 获取 USDT 余额
        if (usdtContract) {
          const usdtBal = await usdtContract.balanceOf(address);
          setUsdtBalance(ethers.utils.formatUnits(usdtBal, 18));
          
          const usdtAllow = await usdtContract.allowance(address, receiverAddress);
          setUsdtAllowance(ethers.utils.formatUnits(usdtAllow, 18));
        }
        
        // 检查是否是TJCD所有者
        if (tokenContract) {
          try {
            // 这里假设代币合约有一个owner()函数，如果没有，可以使用其他方式判断
            // 或者直接使用一个固定的地址作为所有者
            // const owner = await tokenContract.owner();
            // setIsOwner(owner.toLowerCase() === address.toLowerCase());
            
            // 简化处理：使用一个固定地址作为所有者
            setIsOwner(receiverAddress.toLowerCase() === address.toLowerCase());
          } catch (error) {
            console.error("检查所有者错误:", error);
            setIsOwner(false);
          }
        }
      } catch (error) {
        console.error("更新余额和授权错误:", error);
      }
    }
  };
  
  // 定义 loadTrades 函数
  const loadTrades = async (escrowContract) => {
    if (!escrowContract) return;
    try {
      const tradeCount = await escrowContract.tradeCounter();
      const tradeArray = [];
      
      for (let i = 0; i < tradeCount; i++) {
        const trade = await escrowContract.trades(i);
        tradeArray.push({
          id: i,
          seller: trade.seller,
          buyer: trade.buyer,
          amount: ethers.utils.formatUnits(trade.amount, 18),
          isReleased: trade.isReleased,
          isCancelled: trade.isCancelled
        });
      }
      
      setTrades(tradeArray);
    } catch (error) {
      console.error("加载交易错误:", error);
    }
  };

  // 设置TJCD兑换价格函数
  const setExchangeRates = async () => {
    if (!account || !isOwner) {
      alert("只有TJCD所有者才能设置兑换价格");
      return;
    }
    
    setLoading(true);
    try {
      // 这里只是在前端保存价格，实际项目中可能需要将价格保存到智能合约或后端
      localStorage.setItem('tjcd_bnb_rate', exchangeRate);
      localStorage.setItem('tjcd_usdt_rate', usdtExchangeRate);
      
      alert("兑换价格设置成功！");
    } catch (error) {
      console.error("设置兑换价格错误:", error);
      alert("设置兑换价格失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 批准USDT转账
  const approveUSDT = async () => {
    if (!usdtContract) return;
    
    setLoading(true);
    try {
      // 检查网络是否正确
      const network = await provider.getNetwork();
      console.log("当前网络:", network);
      
      // 币安智能链的 chainId 是 56，测试网是 97
      if (network.chainId !== 56 && network.chainId !== 97) {
        throw new Error("请切换到币安智能链网络！当前网络: " + network.name);
      }
      
      // 授权一个非常大的数量，确保足够
      const amount = ethers.utils.parseUnits('10000000', 18);
      console.log("授权USDT金额:", ethers.utils.formatUnits(amount, 18));
      
      const gasLimit = 100000;
      const gasPrice = await provider.getGasPrice();
      
      const tx = await usdtContract.approve(receiverAddress, amount, {
        gasLimit: gasLimit,
        gasPrice: gasPrice.mul(120).div(100) // 增加 20% 的 gas 价格
      });
      
      console.log("USDT授权交易已提交:", tx.hash);
      const receipt = await tx.wait();
      console.log("USDT授权交易已确认:", receipt);
      
      if (account) {
        updateBalanceAndAllowance(account, tokenContract, escrowContract);
      }
      
      alert("USDT授权成功!");
    } catch (error) {
      console.error("USDT授权错误:", error);
      alert("USDT授权失败: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // 使用BNB购买TJCD
  const buyWithBNB = async () => {
    if (!tokenContract || !tradeAmount || !exchangeRate || parseFloat(exchangeRate) <= 0) {
      alert("请确保输入了有效的交易金额和兑换价格");
      return;
    }
    
    setLoading(true);
    try {
      // 计算需要支付的BNB数量
      const tjcdAmount = parseFloat(tradeAmount);
      const bnbAmount = tjcdAmount * parseFloat(exchangeRate);
      const bnbWei = ethers.utils.parseEther(bnbAmount.toString());
      
      console.log("购买TJCD数量:", tjcdAmount);
      console.log("支付BNB数量:", bnbAmount);
      
      // 获取当前Gas价格
      const gasPrice = await provider.getGasPrice();
      // 增加20%的Gas价格以确保交易能够快速被确认
      const adjustedGasPrice = gasPrice.mul(120).div(100);
      // 设置Gas限制
      const gasLimit = 100000;
      // 计算预估的Gas费用
      const estimatedGasCost = adjustedGasPrice.mul(gasLimit);
      
      // 检查BNB余额是否足够支付交易金额和Gas费用
      const bnbBalance = await provider.getBalance(account);
      const totalCost = bnbWei.add(estimatedGasCost);
      
      console.log("当前BNB余额:", ethers.utils.formatEther(bnbBalance));
      console.log("交易金额:", ethers.utils.formatEther(bnbWei));
      console.log("预估Gas费用:", ethers.utils.formatEther(estimatedGasCost));
      console.log("总花费:", ethers.utils.formatEther(totalCost));
      
      if (bnbBalance.lt(totalCost)) {
        throw new Error("BNB余额不足，无法支付交易金额和Gas费用。请确保您有足够的BNB。");
      }
      
      // 发送BNB到指定地址
      const signer = provider.getSigner();
      const tx = await signer.sendTransaction({
        to: receiverAddress,
        value: bnbWei,
        gasLimit: gasLimit,
        gasPrice: adjustedGasPrice
      });
      
      console.log("BNB转账交易已提交:", tx.hash);
      const receipt = await tx.wait();
      console.log("BNB转账交易已确认:", receipt);
      
      // 通知卖家已经支付完成，可以释放TJCD
      alert("BNB支付成功！请等待卖家释放TJCD到您的钱包。");
      
      // 更新余额
      if (account) {
        updateBalanceAndAllowance(account, tokenContract, escrowContract);
      }
    } catch (error) {
      console.error("BNB购买错误:", error);
      
      // 改进错误信息处理
      let errorMessage = "BNB购买失败";
      
      // 检查是否是Gas费用不足的问题
      if (error.message && (error.message.includes("gas") || error.message.includes("Gas") || 
          error.message.includes("insufficient funds") || error.message.includes("余额不足"))) {
        errorMessage = "Gas 费用问题，请确保您有足够的 BNB 支付 Gas 费用";
      } else if (error.reason) {
        errorMessage += ": " + error.reason;
      } else if (error.message) {
        errorMessage += ": " + error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // 使用USDT购买TJCD
  const buyWithUSDT = async () => {
    if (!usdtContract || !tokenContract || !tradeAmount || !usdtExchangeRate || parseFloat(usdtExchangeRate) <= 0) {
      alert("请确保输入了有效的交易金额和USDT兑换价格");
      return;
    }
    
    setLoading(true);
    try {
      // 计算需要支付的USDT数量
      const tjcdAmount = parseFloat(tradeAmount);
      const usdtAmount = tjcdAmount * parseFloat(usdtExchangeRate);
      const usdtWei = ethers.utils.parseUnits(usdtAmount.toString(), 18);
      
      console.log("购买TJCD数量:", tjcdAmount);
      console.log("支付USDT数量:", usdtAmount);
      
      // 检查USDT余额和授权是否足够
      const usdtBalance = await usdtContract.balanceOf(account);
      if (usdtBalance.lt(usdtWei)) {
        throw new Error("USDT余额不足，无法完成购买");
      }
      
      const usdtAllowance = await usdtContract.allowance(account, receiverAddress);
      if (usdtAllowance.lt(usdtWei)) {
        throw new Error("USDT授权不足，请先授权USDT");
      }
      
      // 转移USDT到指定地址
      const tx = await usdtContract.transfer(receiverAddress, usdtWei, {
        gasLimit: 100000,
        gasPrice: (await provider.getGasPrice()).mul(120).div(100)
      });
      
      console.log("USDT转账交易已提交:", tx.hash);
      const receipt = await tx.wait();
      console.log("USDT转账交易已确认:", receipt);
      
      // 通知卖家已经支付完成，可以释放TJCD
      alert("USDT支付成功！请等待卖家释放TJCD到您的钱包。");
      
      // 更新余额
      if (account) {
        updateBalanceAndAllowance(account, tokenContract, escrowContract);
      }
    } catch (error) {
      console.error("USDT购买错误:", error);
      alert("USDT购买失败: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // 使用其他方式购买TJCD
  const buyWithOtherMethod = () => {
    if (!tradeAmount) {
      alert("请输入要购买的TJCD数量");
      return;
    }
    
    // 生成付款信息
    const paymentInfo = `请通过其他方式向卖家支付，并提供以下信息：
买家钱包地址：${account}
购买TJCD数量：${tradeAmount}
付款方式：${otherPaymentInfo}`;
    
    alert(paymentInfo);
  };
  
  // 直接转账TJCD给买家（TJCD所有者使用）
  const transferTJCDToBuyer = async () => {
    if (!tokenContract || !buyerAddress || !tradeAmount) {
      alert("请确保输入了有效的买家地址和交易金额");
      return;
    }
    
    if (!isOwner) {
      alert("只有TJCD所有者才能直接转账TJCD");
      return;
    }
    
    // 验证买家地址是否为有效的以太坊地址
    if (!ethers.utils.isAddress(buyerAddress)) {
      alert("买家地址格式无效，请输入有效的0x开头的地址");
      return;
    }
    
    setLoading(true);
    try {
      // 检查网络是否正确
      const network = await provider.getNetwork();
      console.log("当前网络:", network);
      
      // 检查余额是否足够
      const balance = await tokenContract.balanceOf(account);
      const amount = ethers.utils.parseUnits(tradeAmount, 18);
      
      if (balance.lt(amount)) {
        throw new Error("TJCD余额不足，无法完成转账");
      }
      
      console.log("准备转账TJCD...");
      console.log("买家地址:", buyerAddress);
      console.log("转账金额:", tradeAmount);
      
      // 直接转账TJCD给买家
      const tx = await tokenContract.transfer(buyerAddress, amount, {
        gasLimit: 100000,
        gasPrice: (await provider.getGasPrice()).mul(120).div(100)
      });
      
      console.log("TJCD转账交易已提交:", tx.hash);
      const receipt = await tx.wait();
      console.log("TJCD转账交易已确认:", receipt);
      
      setBuyerAddress('');
      setTradeAmount('');
      
      if (account) {
        updateBalanceAndAllowance(account, tokenContract, escrowContract);
      }
      
      alert("TJCD转账成功！");
    } catch (error) {
      console.error("TJCD转账错误:", error);
      alert("TJCD转账失败: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // 在 useEffect 中添加网络检查
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          // 检查网络
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const network = await provider.getNetwork();
          console.log("当前网络:", network);
          
          // 币安智能链的 chainId 是 56，测试网是 97
          if (network.chainId !== 56 && network.chainId !== 97) {
            alert("请切换到币安智能链网络！当前网络: " + network.name);
          }
          
          setProvider(provider);
          
          // eslint-disable-next-line no-unused-vars
          const signer = provider.getSigner();
          // Remove this line: setSigner(signer);
          
          const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
          setTokenContract(tokenContract);
          
          const escrowContract = new ethers.Contract(escrowAddress, escrowABI, signer);
          setEscrowContract(escrowContract);
          
          // 初始化USDT合约
          const usdtContract = new ethers.Contract(usdtAddress, tokenABI, signer); // 使用相同的ABI，因为都是ERC20代币
          setUsdtContract(usdtContract);
          
          // 从本地存储加载兑换价格
          const savedBnbRate = localStorage.getItem('tjcd_bnb_rate');
          const savedUsdtRate = localStorage.getItem('tjcd_usdt_rate');
          
          if (savedBnbRate) setExchangeRate(savedBnbRate);
          if (savedUsdtRate) setUsdtExchangeRate(savedUsdtRate);
          
          // 获取账户信息
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            updateBalanceAndAllowance(accounts[0], tokenContract, escrowContract);
            loadTrades(escrowContract);
          }
        } catch (error) {
          console.error("初始化错误:", error);
        }
      } else {
        alert("请安装 MetaMask 或其他兼容的钱包!");
      }
    };
    
    init();
    
    // 添加网络变化监听器
    if (window.ethereum) {
      // 处理网络变化
      const handleChainChanged = async (chainId) => {
        console.log("网络已变更:", chainId);
        // 将chainId从十六进制转换为十进制
        const chainIdDecimal = parseInt(chainId, 16);
        
        // 检查是否是币安智能链
        if (chainIdDecimal !== 56 && chainIdDecimal !== 97) {
          alert("请确保在整个交易过程中保持在币安智能链网络！当前网络ID: " + chainIdDecimal);
        } else {
          // 网络正确，重新初始化
          window.location.reload();
        }
      };
      
      // 处理账户变化
      const handleAccountsChanged = (accounts) => {
        console.log("账户已变更:", accounts);
        if (accounts.length === 0) {
          // 用户断开了钱包连接
          setAccount(null);
          setBalance(null);
          setAllowance('0');
          setUsdtBalance('0');
          setUsdtAllowance('0');
          setTrades([]);
          setIsOwner(false);
          alert("钱包已断开连接");
        } else {
          // 用户切换了账户
          setAccount(accounts[0]);
          if (tokenContract && escrowContract) {
            updateBalanceAndAllowance(accounts[0], tokenContract, escrowContract);
            loadTrades(escrowContract);
          }
        }
      };
      
      // 添加事件监听器
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // 清理函数
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []); // 移除依赖项，因为函数已经在useEffect之前定义

  const connectWallet = async () => {
    setLoading(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      
      if (tokenContract && escrowContract) {
        updateBalanceAndAllowance(accounts[0], tokenContract, escrowContract);
        loadTrades(escrowContract);
      }
    } catch (error) {
      console.error("连接钱包错误:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveTokens = async () => {
    if (!tokenContract) return;
    
    setLoading(true);
    try {
      // 检查网络是否正确
      const network = await provider.getNetwork();
      console.log("当前网络:", network);
      
      // 币安智能链的 chainId 是 56，测试网是 97
      if (network.chainId !== 56 && network.chainId !== 97) {
        throw new Error("请切换到币安智能链网络！当前网络: " + network.name);
      }
      
      // 获取当前余额，授权全部余额
      const balance = await tokenContract.balanceOf(account);
      console.log("当前余额:", ethers.utils.formatUnits(balance, 18));
      
      // 授权一个非常大的数量，确保足够
      const amount = ethers.utils.parseUnits('10000000', 18);
      console.log("授权金额:", ethers.utils.formatUnits(amount, 18));
      
      const gasLimit = 100000;
      const gasPrice = await provider.getGasPrice();
      
      // 添加网络监听，防止交易过程中网络变化
      const networkChangeHandler = () => {
        throw new Error("网络发生变化，交易已取消");
      };
      
      // 添加网络变化监听
      window.ethereum.on('chainChanged', networkChangeHandler);
      
      try {
        const tx = await tokenContract.approve(escrowAddress, amount, {
          gasLimit: gasLimit,
          gasPrice: gasPrice.mul(120).div(100) // 增加 20% 的 gas 价格
        });
        
        console.log("授权交易已提交:", tx.hash);
        const receipt = await tx.wait();
        console.log("授权交易已确认:", receipt);
        
        if (account) {
          updateBalanceAndAllowance(account, tokenContract, escrowContract);
        }
        
        alert("代币授权成功!");
      } finally {
        // 移除网络变化监听
        window.ethereum.removeListener('chainChanged', networkChangeHandler);
      }
    } catch (error) {
      console.error("代币授权错误:", error);
      
      let errorMessage = "代币授权失败";
      
      // 检查是否是网络变化问题
      if (error.message && (error.message.includes("underlying network changed") || 
                           error.message.includes("网络发生变化"))) {
        errorMessage = "网络发生变化，授权失败。请确保在整个交易过程中保持在币安智能链网络";
      } 
      // 检查是否是网络问题
      else if (error.message && error.message.includes("network")) {
        errorMessage = "网络错误，请确保连接到币安智能链";
      }
      // 其他错误
      else if (error.reason) {
        errorMessage += ": " + error.reason;
      } else if (error.message) {
        errorMessage += ": " + error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createTrade = async () => {
    if (!escrowContract || !buyerAddress || !tradeAmount) return;
    
    setLoading(true);
    try {
      // 验证买家地址是否为有效的以太坊地址
      if (!ethers.utils.isAddress(buyerAddress)) {
        throw new Error("买家地址格式无效，请输入有效的0x开头的地址");
      }
      
      // 检查网络是否正确
      const network = await provider.getNetwork();
      console.log("当前网络:", network);
      
      // 检查授权是否足够
      const currentAllowance = await tokenContract.allowance(account, escrowAddress);
      const amount = ethers.utils.parseUnits(tradeAmount, 18);
      
      if (currentAllowance.lt(amount)) {
        throw new Error("代币授权不足，请先点击'授权代币给托管合约'按钮");
      }
      
      // 检查余额是否足够
      const balance = await tokenContract.balanceOf(account);
      if (balance.lt(amount)) {
        throw new Error("代币余额不足，无法创建交易");
      }
      
      console.log("准备创建交易...");
      console.log("买家地址:", buyerAddress);
      console.log("交易金额:", tradeAmount);
      console.log("托管合约地址:", escrowAddress);
      
      // 添加 gas 限制和 gasPrice
      const gasLimit = 1000000; // 增加 gas 限制
      const gasPrice = await provider.getGasPrice();
      console.log("Gas价格:", ethers.utils.formatUnits(gasPrice, "gwei"), "Gwei");
      
      // 尝试估算 gas
      try {
        const estimatedGas = await escrowContract.estimateGas.createTrade(buyerAddress, amount);
        console.log("估算的Gas:", estimatedGas.toString());
        // 使用估算的 gas 加上一些余量
        const adjustedGasLimit = estimatedGas.mul(150).div(100); // 增加 50%
        console.log("调整后的Gas限制:", adjustedGasLimit.toString());
        
        const tx = await escrowContract.createTrade(buyerAddress, amount, {
          gasLimit: adjustedGasLimit,
          gasPrice: gasPrice.mul(120).div(100) // 增加 20% 的 gas 价格
        });
        
        console.log("交易已提交:", tx.hash);
        const receipt = await tx.wait();
        console.log("交易已确认:", receipt);
        
        setBuyerAddress('');
        setTradeAmount('');
        
        if (account) {
          updateBalanceAndAllowance(account, tokenContract, escrowContract);
          loadTrades(escrowContract);
        }
        
        alert("交易创建成功!");
      } catch (estimateError) {
        console.error("Gas估算错误:", estimateError);
        // 如果估算失败，使用固定的 gas 限制
        console.log("使用固定的Gas限制:", gasLimit);
        
        const tx = await escrowContract.createTrade(buyerAddress, amount, {
          gasLimit: gasLimit,
          gasPrice: gasPrice.mul(120).div(100) // 增加 20% 的 gas 价格
        });
        
        console.log("交易已提交:", tx.hash);
        const receipt = await tx.wait();
        console.log("交易已确认:", receipt);
        
        setBuyerAddress('');
        setTradeAmount('');
        
        if (account) {
          updateBalanceAndAllowance(account, tokenContract, escrowContract);
          loadTrades(escrowContract);
        }
        
        alert("交易创建成功!");
      }
    } catch (error) {
      console.error("创建交易错误:", error);
      let errorMessage = "创建交易失败";
      
      // 检查是否有交易收据
      if (error.receipt) {
        console.log("交易收据:", error.receipt);
        errorMessage += ": 交易被区块链接受但执行失败，可能是合约条件检查未通过";
      }
      
      if (error.reason) {
        errorMessage += ": " + error.reason;
      } else if (error.message) {
        errorMessage += ": " + error.message;
      }
      
      // 检查是否是授权问题
      if (error.message && error.message.includes("transfer amount exceeds allowance")) {
        errorMessage = "代币授权不足，请先点击'授权代币给托管合约'按钮";
      }
      
      // 检查是否是余额问题
      if (error.message && error.message.includes("transfer amount exceeds balance")) {
        errorMessage = "代币余额不足，无法创建交易";
      }
      
      // 检查是否是网络问题
      if (error.message && error.message.includes("network")) {
        errorMessage = "网络错误，请确保连接到币安智能链";
      }
      
      // 检查是否是 nonce 问题
      if (error.message && error.message.includes("nonce")) {
        errorMessage = "交易 nonce 错误，请刷新 MetaMask 或重新连接钱包";
      }
      
      // 检查是否是 gas 问题
      if (error.message && error.message.includes("gas")) {
        errorMessage = "Gas 费用问题，请确保您有足够的 BNB 支付 Gas 费用";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const releaseTrade = async (tradeId) => {
    if (!escrowContract) return;
    
    setLoading(true);
    try {
      const tx = await escrowContract.releaseTrade(tradeId);
      await tx.wait();
      
      if (account) {
        updateBalanceAndAllowance(account, tokenContract, escrowContract);
        loadTrades(escrowContract);
      }
      
      alert("交易释放成功!");
    } catch (error) {
      console.error("释放交易错误:", error);
      alert("释放交易失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelTrade = async (tradeId) => {
    if (!escrowContract) return;
    
    setLoading(true);
    try {
      const tx = await escrowContract.cancelTrade(tradeId);
      await tx.wait();
      
      if (account) {
        updateBalanceAndAllowance(account, tokenContract, escrowContract);
        loadTrades(escrowContract);
      }
      
      alert("交易取消成功!");
    } catch (error) {
      console.error("取消交易错误:", error);
      alert("取消交易失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 添加切换网络函数
  const switchToBSC = async () => {
    if (!window.ethereum) return;
    
    try {
      // 尝试切换到 BSC 主网
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }], // 56 in hex
      });
    } catch (switchError) {
      // 如果网络不存在，则添加网络
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x38', // 56 in hex
                chainName: 'Binance Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
              },
            ],
          });
        } catch (addError) {
          console.error("添加网络错误:", addError);
        }
      } else {
        console.error("切换网络错误:", switchError);
      }
    }
  };

  // 确保ThemeProvider包裹了所有内容
  // 使用媒体查询钩子检测屏幕尺寸
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" className="App">
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{
            fontSize: isMobile ? '1.8rem' : '2.5rem',
            marginTop: isMobile ? '10px' : '20px'
          }}
        >
          TJCD 代币 OTC 交易平台
        </Typography>
        
        {!account ? (
          <Box 
            sx={{ 
              textAlign: 'center', 
              marginTop: isMobile ? '20px' : '30px',
              padding: isMobile ? '10px' : '20px' 
            }}
          >
            <Button 
              variant="contained" 
              color="primary" 
              onClick={connectWallet}
              disabled={loading}
              size={isMobile ? 'medium' : 'large'}
              fullWidth={isMobile}
              sx={{ padding: isMobile ? '8px 16px' : '10px 22px' }}
            >
              {loading ? <CircularProgress size={24} /> : "连接钱包"}
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={switchToBSC}
              sx={{ 
                marginTop: '10px',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              切换到币安智能链
            </Button>
          </Box>
        ) : (
        <div>
          <Typography variant="h6">
            已连接账户: {account.substring(0, 6)}...{account.substring(account.length - 4)}
          </Typography>
          {balance !== null && (
            <Typography variant="h6">
              TJCD 余额: {balance}
            </Typography>
          )}
          {bnbBalance !== null && (
            <Typography variant="h6">
              BNB 余额: {bnbBalance}
            </Typography>
          )}
          {usdtBalance !== '0' && (
            <Typography variant="h6">
              USDT 余额: {usdtBalance}
            </Typography>
          )}
          <Typography variant="h6">
            授权给托管合约的代币: {allowance}
          </Typography>
          
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={approveTokens}
            disabled={loading}
            style={{ marginTop: '20px', marginBottom: '10px' }}
          >
            {loading ? <CircularProgress size={24} /> : "授权TJCD给托管合约"}
          </Button>
          
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={approveUSDT}
            disabled={loading}
            style={{ marginLeft: '10px', marginTop: '20px', marginBottom: '20px' }}
          >
            {loading ? <CircularProgress size={24} /> : "授权USDT"}
          </Button>
          
          {/* TJCD所有者设置价格区域 */}
          {isOwner && (
            <Grid container spacing={3} style={{ marginTop: '10px', marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
              <Grid xs={12}>
                <Typography variant="h5" color="primary">TJCD所有者设置区域</Typography>
                <TextField
                  label="TJCD兑换BNB价格（每TJCD多少BNB）"
                  fullWidth
                  margin="normal"
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  InputProps={{
                    inputProps: { min: 0, step: 0.000001 }
                  }}
                />
                <TextField
                  label="TJCD兑换USDT价格（每TJCD多少USDT）"
                  fullWidth
                  margin="normal"
                  type="number"
                  value={usdtExchangeRate}
                  onChange={(e) => setUsdtExchangeRate(e.target.value)}
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 }
                  }}
                />
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={setExchangeRates}
                  disabled={loading}
                  style={{ marginTop: '10px' }}
                >
                  {loading ? <CircularProgress size={24} /> : "设置兑换价格"}
                </Button>
              </Grid>
            </Grid>
          )}
          
          {/* 根据用户角色显示不同的面板 */}
          {isOwner ? (
            <OwnerPanel
              exchangeRate={exchangeRate}
              setExchangeRate={setExchangeRate}
              usdtExchangeRate={usdtExchangeRate}
              setUsdtExchangeRate={setUsdtExchangeRate}
              setExchangeRates={setExchangeRates}
              buyerAddress={buyerAddress}
              setBuyerAddress={setBuyerAddress}
              tradeAmount={tradeAmount}
              setTradeAmount={setTradeAmount}
              transferTJCDToBuyer={transferTJCDToBuyer}
            />
          ) : (
            <BuyerPanel
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              tradeAmount={tradeAmount}
              setTradeAmount={setTradeAmount}
              otherPaymentInfo={otherPaymentInfo}
              setOtherPaymentInfo={setOtherPaymentInfo}
              buyWithBNB={buyWithBNB}
              buyWithUSDT={buyWithUSDT}
              buyWithOtherMethod={buyWithOtherMethod}
              approveUSDT={approveUSDT}
              exchangeRate={exchangeRate}
              usdtExchangeRate={usdtExchangeRate}
            />
          )}
            <Grid xs={12}>
            
            {/* 托管交易部分 */}
            <Grid xs={12} style={{ marginTop: '20px' }}>
              <Typography variant="h5">创建托管交易</Typography>
              <TextField
                label="买家地址"
                fullWidth
                margin="normal"
                value={buyerAddress}
                onChange={handleBuyerAddressChange}
                error={buyerAddress !== '' && !validateAddress(buyerAddress)}
                helperText={buyerAddress !== '' && !validateAddress(buyerAddress) ? "请输入有效的0x开头的地址" : ""}
              />
              <TextField
                label="托管交易金额"
                fullWidth
                margin="normal"
                type="number"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={createTrade}
                  disabled={loading || !buyerAddress || !tradeAmount}
                >
                  {loading ? <CircularProgress size={24} /> : "创建托管交易"}
                </Button>
                
                {/* 添加TJCD所有者直接转账按钮 */}
                {isOwner && (
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={transferTJCDToBuyer}
                    disabled={loading || !buyerAddress || !tradeAmount}
                  >
                    {loading ? <CircularProgress size={24} /> : "直接转账TJCD给买家"}
                  </Button>
                )}
              </div>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h5">我的交易</Typography>
              {trades.length === 0 ? (
                <Typography>没有交易记录</Typography>
              ) : (
                trades.map((trade) => (
                  <Card key={trade.id} style={{ marginBottom: '10px' }}>
                    <CardContent>
                      <Typography>交易 ID: {trade.id}</Typography>
                      <Typography>卖家: {trade.seller.substring(0, 6)}...{trade.seller.substring(trade.seller.length - 4)}</Typography>
                      <Typography>买家: {trade.buyer.substring(0, 6)}...{trade.buyer.substring(trade.buyer.length - 4)}</Typography>
                      <Typography>金额: {trade.amount} TJCD</Typography>
                      <Typography>状态: {
                        trade.isReleased ? "已完成" : 
                        trade.isCancelled ? "已取消" : 
                        "进行中"
                      }</Typography>
                    </CardContent>
                    {!trade.isReleased && !trade.isCancelled && trade.seller.toLowerCase() === account.toLowerCase() && (
                      <CardActions>
                        <Button 
                          size="small" 
                          color="primary" 
                          onClick={() => releaseTrade(trade.id)}
                          disabled={loading}
                        >
                          释放代币
                        </Button>
                        <Button 
                          size="small" 
                          color="secondary" 
                          onClick={() => cancelTrade(trade.id)}
                          disabled={loading}
                        >
                          取消交易
                        </Button>
                      </CardActions>
                    )}
                  </Card>
                ))
              )}
            </Grid>
          </Grid>
        </div>
      )}
    </Container>
    </ThemeProvider>
  );
}

export default App;