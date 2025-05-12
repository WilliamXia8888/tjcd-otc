import React from 'react';
import { Typography, TextField, Button, Card, CardContent, CardActions, FormControl, FormControlLabel, RadioGroup, Radio, useMediaQuery, useTheme, Box } from '@mui/material';
import Grid from '@mui/material/Grid';

/**
 * 买家面板组件
 * 
 * 这个组件显示普通用户购买TJCD的界面，包括选择支付方式和输入交易金额
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.paymentMethod - 当前选择的支付方式
 * @param {Function} props.setPaymentMethod - 设置支付方式的函数
 * @param {string} props.tradeAmount - 交易数量
 * @param {Function} props.setTradeAmount - 设置交易数量的函数
 * @param {string} props.otherPaymentInfo - 其他支付方式信息
 * @param {Function} props.setOtherPaymentInfo - 设置其他支付方式信息的函数
 * @param {Function} props.buyWithBNB - 使用BNB购买的函数
 * @param {Function} props.buyWithUSDT - 使用USDT购买的函数
 * @param {Function} props.buyWithOtherMethod - 使用其他方式购买的函数
 * @param {Function} props.approveUSDT - 授权USDT的函数
 * @param {string} props.exchangeRate - BNB兑换TJCD的价格
 * @param {string} props.usdtExchangeRate - USDT兑换TJCD的价格
 */
const BuyerPanel = ({
  paymentMethod,
  setPaymentMethod,
  tradeAmount,
  setTradeAmount,
  otherPaymentInfo,
  setOtherPaymentInfo,
  buyWithBNB,
  buyWithUSDT,
  buyWithOtherMethod,
  approveUSDT,
  exchangeRate,
  usdtExchangeRate
}) => {
  // 使用Material-UI的useTheme和useMediaQuery钩子检测移动设备
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // 计算预估支付金额
  const calculatePaymentAmount = () => {
    if (!tradeAmount || tradeAmount <= 0) return '0';
    
    if (paymentMethod === 'bnb') {
      if (!exchangeRate || parseFloat(exchangeRate) <= 0) return '价格未设置';
      return (parseFloat(tradeAmount) * parseFloat(exchangeRate)).toFixed(8) + ' BNB';
    } else if (paymentMethod === 'usdt') {
      if (!usdtExchangeRate || parseFloat(usdtExchangeRate) <= 0) return '价格未设置';
      return (parseFloat(tradeAmount) * parseFloat(usdtExchangeRate)).toFixed(2) + ' USDT';
    }
    
    return '请选择支付方式';
  };
  
  return (
    <Grid container spacing={3}>
      <Grid xs={12}>
        <Typography variant="h5" component="h2" gutterBottom>
          购买TJCD
        </Typography>
      </Grid>
      
      {/* 选择支付方式卡片 */}
      <Grid xs={12} sm={6}>
        <Card sx={{ height: '100%', mb: isMobile ? 2 : 0 }}>
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Typography variant="h6" gutterBottom>
              选择支付方式
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                name="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <FormControlLabel 
                  value="bnb" 
                  control={<Radio />} 
                  label={`BNB (1 TJCD = ${exchangeRate || '未设置'} BNB)`} 
                />
                <FormControlLabel 
                  value="usdt" 
                  control={<Radio />} 
                  label={`USDT (1 TJCD = ${usdtExchangeRate || '未设置'} USDT)`} 
                />
                <FormControlLabel value="other" control={<Radio />} label="其他支付方式" />
              </RadioGroup>
            </FormControl>
            
            {paymentMethod === 'other' && (
              <TextField
                label="其他支付方式信息"
                fullWidth
                margin="normal"
                value={otherPaymentInfo}
                onChange={(e) => setOtherPaymentInfo(e.target.value)}
                helperText="请输入您希望使用的支付方式信息"
                multiline
                rows={2}
              />
            )}
          </CardContent>
        </Card>
      </Grid>
      
      {/* 交易金额卡片 */}
      <Grid xs={12} sm={6}>
        <Card sx={{ height: '100%', mb: isMobile ? 2 : 0 }}>
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Typography variant="h6" gutterBottom>
              交易金额
            </Typography>
            <TextField
              label="购买TJCD数量"
              type="number"
              fullWidth
              margin="normal"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
              helperText="输入要购买的TJCD数量"
            />
            
            <Typography variant="body1" color="textSecondary" style={{ marginTop: 16 }}>
              预估支付金额: {calculatePaymentAmount()}
            </Typography>
          </CardContent>
          <CardActions>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '10px' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={buyWithBNB}
                fullWidth
                disabled={paymentMethod !== 'bnb'}
                size={isMobile ? 'medium' : 'large'}
              >
                使用BNB购买TJCD
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={approveUSDT}
                fullWidth
                disabled={paymentMethod !== 'usdt'}
                size={isMobile ? 'medium' : 'large'}
              >
                授权USDT
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={buyWithUSDT}
                fullWidth
                disabled={paymentMethod !== 'usdt'}
                size={isMobile ? 'medium' : 'large'}
              >
                使用USDT购买TJCD
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={buyWithOtherMethod}
                fullWidth
                disabled={paymentMethod !== 'other' || !otherPaymentInfo}
                size={isMobile ? 'medium' : 'large'}
              >
                使用其他方式购买TJCD
              </Button>
            </Box>
          </CardActions>
        </Card>
      </Grid>
    </Grid>
  );
};

export default BuyerPanel;