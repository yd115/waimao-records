import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Copy, Sparkles, RotateCcw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { quickGenerateQuote, parseQuoteInput } from '@/lib/quote-parser';

export function QuoteGeneratorPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  // 实时生成报价格式
  useEffect(() => {
    if (input.trim()) {
      const result = quickGenerateQuote(input);
      setOutput(result);
    } else {
      setOutput('');
    }
  }, [input]);

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      toast.success('已复制到剪贴板');
    }
  };

  const handleReset = () => {
    setInput('');
    setOutput('');
  };

  const handleExample = () => {
    setInput('汉堡HRM95 20吨小柜吨包价格500');
  };

  // 解析信息用于调试显示
  const parsedInfo = input.trim() ? parseQuoteInput(input) : null;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* 返回按钮 - 移动端优化 */}
        <Button variant="ghost" size="sm" asChild className="h-9">
          <Link to="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">返回</span>
          </Link>
        </Button>

        {/* 页面标题 - 移动端优化 */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-foreground">报价格式生成器</h1>
          <p className="text-sm text-muted-foreground">
            快速转换为标准外贸报价格式
          </p>
        </div>

        {/* 使用说明 - 移动端优化 */}
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              使用说明
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                <strong>输入示例：</strong>汉堡HRM95 20吨小柜吨包价格500
              </p>
              <p>
                <strong>输出格式：</strong>CIF Hamburg: USD500/MT, 20MT for 1X20'FCL, packing in 1000kg big bags with pallets
              </p>
              <div className="pt-2 space-y-1">
                <p className="font-medium">支持识别：</p>
                <ul className="list-disc list-inside space-y-0.5 pl-2 text-xs">
                  <li>港口：汉堡、不来梅、鹿特丹、安特卫普等</li>
                  <li>产品型号：HRM95、GB-CKP106 等</li>
                  <li>柜型：小柜(20')、大柜(40')、高柜(40'HQ)</li>
                  <li>包装：1000kg吨包、500kg吨包、25kg小袋、20kg小袋</li>
                  <li>价格类型：CIF、FOB、CFR（默认CIF）</li>
                </ul>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleExample} className="h-8 text-xs">
              加载示例
            </Button>
          </CardContent>
        </Card>

        {/* 输入区域 - 移动端优化 */}
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-base">输入信息</CardTitle>
            <CardDescription className="text-xs">
              输入简短的报价信息，自动生成标准格式
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="input" className="text-sm">快速输入</Label>
              <Textarea
                id="input"
                placeholder="例如：汉堡HRM95 20吨小柜吨包价格500"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </div>

            {/* 识别信息预览 - 移动端优化 */}
            {parsedInfo && (
              <div className="p-3 bg-muted rounded-lg space-y-2 text-xs">
                <p className="font-medium text-foreground">识别到的信息：</p>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  {parsedInfo.port && (
                    <div>
                      <span className="font-medium">港口：</span>
                      {parsedInfo.port}
                    </div>
                  )}
                  {parsedInfo.product && (
                    <div>
                      <span className="font-medium">产品：</span>
                      {parsedInfo.product}
                    </div>
                  )}
                  {parsedInfo.quantity && (
                    <div>
                      <span className="font-medium">数量：</span>
                      {parsedInfo.quantity}MT
                    </div>
                  )}
                  {parsedInfo.container && (
                    <div>
                      <span className="font-medium">柜型：</span>
                      {parsedInfo.container}
                    </div>
                  )}
                  {parsedInfo.packing && (
                    <div className="col-span-2">
                      <span className="font-medium">包装：</span>
                      {parsedInfo.packing}
                    </div>
                  )}
                  {parsedInfo.price && (
                    <div>
                      <span className="font-medium">价格：</span>
                      USD{parsedInfo.price}/MT
                    </div>
                  )}
                  {parsedInfo.priceType && (
                    <div>
                      <span className="font-medium">价格类型：</span>
                      {parsedInfo.priceType}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="h-9 text-sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                重置
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 输出区域 - 移动端优化 */}
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-base">标准报价格式</CardTitle>
            <CardDescription className="text-xs">
              自动生成的标准外贸报价格式
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="output" className="text-sm">生成结果</Label>
              <Textarea
                id="output"
                value={output}
                readOnly
                className="min-h-[120px] font-mono text-sm bg-muted"
                placeholder="输入信息后，这里会自动显示标准格式..."
              />
            </div>
            <Button onClick={handleCopy} disabled={!output} className="w-full h-10 text-sm">
              <Copy className="h-4 w-4 mr-2" />
              复制报价格式
            </Button>
          </CardContent>
        </Card>

        {/* 常用港口快速参考 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">常用港口参考</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-foreground">欧洲</p>
                <p className="text-muted-foreground">汉堡 Hamburg</p>
                <p className="text-muted-foreground">不来梅 Bremen</p>
                <p className="text-muted-foreground">鹿特丹 Rotterdam</p>
                <p className="text-muted-foreground">安特卫普 Antwerp</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">中国</p>
                <p className="text-muted-foreground">上海 Shanghai</p>
                <p className="text-muted-foreground">宁波 Ningbo</p>
                <p className="text-muted-foreground">深圳 Shenzhen</p>
                <p className="text-muted-foreground">青岛 Qingdao</p>
                <p className="text-muted-foreground">天津新港 XINGANG</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">柜型</p>
                <p className="text-muted-foreground">小柜 20'FCL</p>
                <p className="text-muted-foreground">大柜 40'FCL</p>
                <p className="text-muted-foreground">高柜 40'HQ</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">包装</p>
                <p className="text-muted-foreground">1000kg吨包</p>
                <p className="text-muted-foreground">500kg吨包</p>
                <p className="text-muted-foreground">25kg小袋</p>
                <p className="text-muted-foreground">20kg小袋</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
