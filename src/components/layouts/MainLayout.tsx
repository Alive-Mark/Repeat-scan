/**
 * 主布局组件
 * 包含侧边栏导航和主内容区域
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ScanSearch, 
  History, 
  Settings, 
  Menu, 
  X,
  Sparkles,
  Cloud,
  Clock,
  Shield,
  Languages,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/routes';
import type { ComingSoonFeature } from '@/types/scan';

// 本期不实现的功能列表
const comingSoonFeatures: ComingSoonFeature[] = [
  {
    id: '1',
    name: '云端同步',
    description: '将扫描结果和历史记录同步到云端，随时随地访问',
    icon: 'Cloud',
  },
  {
    id: '2',
    name: '定时自动扫描',
    description: '设置定时任务，自动扫描指定文件夹的重复文件',
    icon: 'Clock',
  },
  {
    id: '3',
    name: '扫描计划任务',
    description: '创建和管理多个扫描计划，按需执行',
    icon: 'Settings',
  },
  {
    id: '4',
    name: '文件加密',
    description: '对重要文件进行加密保护，提升安全性',
    icon: 'Shield',
  },
  {
    id: '5',
    name: '文件压缩',
    description: '自动压缩大文件，节省存储空间',
    icon: 'Sparkles',
  },
  {
    id: '6',
    name: '多语言支持',
    description: '支持中文、英文等多种语言界面',
    icon: 'Languages',
  },
  {
    id: '7',
    name: '主题切换',
    description: '自定义界面主题颜色和风格',
    icon: 'Palette',
  },
];

// 图标映射
const iconMap: Record<string, React.ReactNode> = {
  Cloud: <Cloud className="h-5 w-5" />,
  Clock: <Clock className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  Languages: <Languages className="h-5 w-5" />,
  Palette: <Palette className="h-5 w-5" />,
};

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 获取可见的导航路由
  const visibleRoutes = routes.filter(route => route.visible);

  // 导航项图标
  const getNavIcon = (name: string) => {
    switch (name) {
      case '扫描配置':
        return <ScanSearch className="h-5 w-5" />;
      case '历史记录':
        return <History className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  // 导航链接组件
  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {visibleRoutes.map((route) => {
        const isActive = location.pathname === route.path;
        return (
          <Link
            key={route.path}
            to={route.path}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {getNavIcon(route.name)}
            <span className="font-medium">{route.name}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* 桌面端侧边栏 */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card shrink-0">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <ScanSearch className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">重复文件扫描</span>
          </Link>
        </div>
        
        <ScrollArea className="flex-1 px-3">
          <nav className="flex flex-col gap-1">
            <NavLinks />
          </nav>
          
          <Separator className="my-4" />
          
          {/* 本期不实现功能入口 */}
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              即将上线
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 px-3 text-muted-foreground"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>高级功能</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Beta</Badge>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    即将上线的功能
                  </DialogTitle>
                  <DialogDescription>
                    以下功能正在开发中，敬请期待
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {comingSoonFeatures.map((feature) => (
                    <div 
                      key={feature.id} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        {iconMap[feature.icon]}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{feature.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">开发中</Badge>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            重复文件扫描工具 v1.0
          </p>
        </div>
      </aside>

      {/* 移动端顶部导航 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-md">
              <ScanSearch className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">重复文件扫描</span>
          </Link>
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <SheetTitle className="sr-only">导航菜单</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <span className="font-semibold">菜单</span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex-1 p-3 flex flex-col gap-1">
                  <NavLinks onClick={() => setMobileMenuOpen(false)} />
                  <Separator className="my-4" />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-3"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>高级功能</span>
                        <Badge variant="secondary" className="ml-auto text-xs">Beta</Badge>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          即将上线的功能
                        </DialogTitle>
                        <DialogDescription>
                          以下功能正在开发中，敬请期待
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="max-h-[60vh]">
                        <div className="grid gap-3 py-4">
                          {comingSoonFeatures.map((feature) => (
                            <div 
                              key={feature.id} 
                              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                            >
                              <div className="p-2 rounded-md bg-primary/10 text-primary">
                                {iconMap[feature.icon]}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{feature.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {feature.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 主内容区域 */}
      <main className="flex-1 min-w-0 lg:pt-0 pt-14">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
