import React from 'react';
import { Typography, TextField, Button, Card, CardContent, CardActions, useMediaQuery, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid';

/**
 * 所有者面板组件
 * 
 * 这个组件显示TJCD所有者特有的功能界面，包括设置代币兑换价格和向买家转账TJCD
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.exchangeRate - BNB兑换TJCD的价格
 * @param {Function} props.setExchangeRate - 设置BNB兑换价格的函数
 * @param {string} props.usdtExchangeRate - USDT兑换TJCD的价格
 * @param {Function} props.setUsdtExchangeRate - 设置USDT兑换价格的函数
 * @param {Function} props.setExchangeRates - 保存兑换价格的函数
 * @param {string} props.buyerAddress - 买家钱包地址
 * @param {Function} props.setBuyerAddress - 设置买家地址的函数
 * @param {string} props.tradeAmount - 交易数量
 * @param {Function} props.setTradeAmount - 设置交易数量的函数
 * @param {Function} props.transferTJCDToBuyer - 向买家转账TJCD的函数
 */
const OwnerPanel = ({
  exchangeRate,
  setExchangeRate,
  usdtExchangeRate,
  setUsdtExchangeRate,
  setExchangeRates,
  buyerAddress,
  setBuyerAddress,
  tradeAmount,
  setTradeAmount,
  transferTJCDToBuyer
}) => {
  // 使用Material-UI的useTheme和useMediaQuery钩子检测移动设备
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Grid container spacing={3}>
      <Grid xs={12}>
        <Typography variant="h5" component="h2" gutterBottom>
          TJCD所有者管理面板
        </Typography>
      </Grid>
      
      {/* 设置兑换价格卡片 */}
      <Grid xs={12} sm={6}>
        <Card sx={{ height: '100%', mb: isMobile ? 2 : 0 }}>
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Typography variant="h6" gutterBottom>
              设置TJCD兑换价格
            </Typography>
            <TextField
              label="TJCD兑换BNB价格"
              type="number"
              fullWidth
              margin="normal"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              helperText="1 TJCD = ? BNB"
            />
            <TextField
              label="TJCD兑换USDT价格"
              type="number"
              fullWidth
              margin="normal"
              value={usdtExchangeRate}
              onChange={(e) => setUsdtExchangeRate(e.target.value)}
              helperText="1 TJCD = ? USDT"
            />
          </CardContent>
          <CardActions>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={setExchangeRates}
              fullWidth
            >
              保存价格设置
            </Button>
          </CardActions>
        </Card>
      </Grid>
      
      {/* 向买家转账TJCD卡片 */}
      <Grid xs={12} sm={6}>
        <Card sx={{ height: '100%', mb: isMobile ? 2 : 0 }}>
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Typography variant="h6" gutterBottom>
              向买家转账TJCD
            </Typography>
            <TextField
              label="买家钱包地址"
              fullWidth
              margin="normal"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              helperText="输入0x开头的买家钱包地址"
            />
            <TextField
              label="转账TJCD数量"
              type="number"
              fullWidth
              margin="normal"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
              helperText="输入要转账的TJCD数量"
            />
          </CardContent>
          <CardActions>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={transferTJCDToBuyer}
              fullWidth
              size={isMobile ? 'medium' : 'large'}
            >
              转账TJCD给买家
            </Button>
          </CardActions>
        </Card>
      </Grid>
    </Grid>
  );
};

export default OwnerPanel;