"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApolloProvider } from "@apollo/client";
import client from "@/api/apollo-client-ws";

import {
  ConfigProvider,
  Layout,
  Menu,
  Avatar,
  Button,
  theme,
  Flex,
  Dropdown,
  Space,
  notification,
  Breadcrumb,
  Tag,
} from "antd";
import { List, MenuProps } from "antd";

import {
  MoonOutlined,
  SunOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  CalculatorOutlined,
  InboxOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { GrUserAdmin } from "react-icons/gr";
import LayoutContext from "@/contexts/LayoutContextProvider";
import RouteTracker from "@/components/Common/RouteTracker";

import { useLocale, useTranslations } from "next-intl";
import LangSwitcher from "../Common/LangSwitcher";
import { breadcrumbState, currentAdminTheme, userState } from "@/state/state";
import { useAtom } from "jotai";
import api from "@/api";
import { ROUTES } from "@/routes";
import { formatNumber } from "@/lib";
import { Content } from "antd/es/layout/layout";
import Link from "next/link";
import { FaFootball, FaUsersGear } from "react-icons/fa6";
import { MdAnnouncement } from "react-icons/md";
import { SiDistrokid } from "react-icons/si";
import { BiDiamond, BiSupport } from "react-icons/bi";

import Image from "next/image";
import Loading from "@/assets/img/main/loader.png";
import Logo from "@/assets/img/logo.png";

const { Header, Sider } = Layout;

export default function PartnerRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [mounted, setMount] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [selectedkeys, setSelectedkeys] = useState<string[]>(["home"]);
  const [isDarkTheme, setDarkTheme] = useAtom<boolean>(currentAdminTheme);
  const [isAdmin, setAdmin] = useState<boolean>(false);
  const [isPartner, setPartner] = useState<boolean>(false);
  const [currentMenuItems, setCurrentMenuItems] = useState<any[]>([]);
  const [notiApi, contextHolder] = notification.useNotification();
  const [breadcrumbMenu] = useAtom<string[]>(breadcrumbState);
  const t = useTranslations();
  const locale = useLocale();

  const [currentUser, setUser] = useAtom<any>(userState);
  const [pathname, setPathname] = useState<string>('');
  const [info, setInfo] = useState<any>({});
  const [previousInfo, setPreviousInfo] = useState<any>({});
  const [newNotifications, setNewNotifications] = useState<any>({});
  const [dashboardStats, setDashboardStats] = useState<any>({});

  useEffect(() => {
    setPathname(window.location.pathname);
    fetchDashboardStats();
    // fetchHonorLinkBalance();
  }, []);

  useEffect(() => {
    // Only fetch info after currentUser is set
    if (currentUser?.role) {
      fetchInfo();
    }
  }, [currentUser]);

  const playAlarmSound = () => {
    const audio = document.querySelector('audio[src="/wav/alarm.wav"]') as HTMLAudioElement;
    if (audio) {
      audio.play().catch((error) => {
        console.log('Audio play failed:', error);
      });
    }
  };

  const checkForNewNotifications = (currentStats: any, previousStats: any) => {
    const notificationFields = [
      'registeredUsers',
      'numberOfDepositorsToday', 
      'numberOfWithdrawalToday',
      'membershipInquiry',
      'rollingTransition',
      'depositToday',
      'withdrawToday',
      'numberOfBettingMembersToday',
      'numberOfBetsToday'
    ];

    const newNotificationsDetected: any = {};
    let hasNewNotifications = false;

    notificationFields.forEach(field => {
      const currentValue = currentStats[field] || 0;
      const previousValue = previousStats[field] || 0;
      
      if (currentValue > previousValue) {
        newNotificationsDetected[field] = currentValue - previousValue;
        hasNewNotifications = true;
      }
    });

    if (hasNewNotifications) {
      setNewNotifications(newNotificationsDetected);
      playAlarmSound();
      
      // Clear new notifications after 5 seconds
      setTimeout(() => {
        setNewNotifications({});
      }, 5000);
    }

    return newNotificationsDetected;
  };

  const fetchInfo = () => {
    // Use partner endpoint for partner users (this is PartnerRootLayout, so default to partner)
    const endpoint = currentUser?.role === "A" 
      ? "admin/dashboard/get-data" 
      : "partner/dashboard/get-header-data";
    
    api(endpoint, {
      method: "GET",
    }).then((res) => {
      if (res) {
        const currentStats = res.stats;
        
        // Check for new notifications if we have previous data
        if (Object.keys(previousInfo).length > 0) {
          checkForNewNotifications(currentStats, previousInfo);
        }
        
        setPreviousInfo(info);
        setInfo(currentStats);
        console.log(res.stats, "res.data");
        setTimeout(() => {
          fetchInfo();
        }, 10000);
      }
    });
  };

  const fetchDashboardStats = () => {
    api("partner/dashboard/stats", {
      method: "GET",
    }).then((res) => {
      if (res && res.stats) {
        setDashboardStats(res.stats);
        console.log(res.stats, "dashboard stats");
        setTimeout(() => {
          fetchDashboardStats();
        }, 10000); // Refetch every 10 seconds
      }
    }).catch((err) => {
      console.error("Error fetching dashboard stats:", err);
      setTimeout(() => {
        fetchDashboardStats();
      }, 10000); // Retry after 10 seconds even on error
    });
  };

  const data = [
    {
      label: t("depositToday"),
      // depositToday sum on transaction table for this user and sub users
      value: dashboardStats.depositToday || 0,
      color: "dodgerblue",
    },
    {
      label: t("withdrawlToday"),
      // withdrawlToday sum on transaction table for this user and sub users
      value: dashboardStats.withdrawToday || 0,
      color: "hotpink",
    },
    {
      label: t("bettingToday"),
      // bettingToday sum on transaction table for this user and sub users
      value: dashboardStats.bettingToday || 0,
      color: "lime",
    },
    {
      label: t("todaysWinner"),
      // today's win sum on transaction table for this user
      value: dashboardStats.todayWinners || 0,
      color: "yellow",
    },
    {
      label: t("lowerHoldingAmount"),
      // sub users balance sum
      value: dashboardStats.lowerHoldingAmount || 0,
      color: "mediumorchid",
    },
    {
      label : t("myBalance"),
      // current user balance
      value: dashboardStats.myBalance || 0,
      color: "cyan",
    },
    {
      label: t("point"),
      // current user point
      value: dashboardStats.point || 0,
      color: "magenta",
    },
    {
      label: t("today'sLossingMoney"),
      // today's losing money sum on bet table for this user and sub users
      value: dashboardStats.todaysLossingMoney || 0,
      color: "orangered",
    },
    {
      label: t("today'sRollingGold"),
      // today's rolling gold sum on profile table for this user and sub users
      value: dashboardStats.todaysRollingGold || 0,
      color: "deepskyblue",
    }
  ];

  const onLogout = () => {
    api("auth/logout", { method: "POST" }).then(() => {
      setUser({});
      localStorage.removeItem("token");
      router.push(ROUTES.partner.login);
    });
  };

  const sideBarItems: MenuProps["items"] = [
    {
      key: "home",
      label: (
        <List
          className="!text-white"
          style={{
            borderRadius: '10px',
            border: '1px solid #09188962',
            padding: '10px',
            backgroundColor:'#002140'
          }}
          header={""}
          dataSource={data}
          renderItem={(item: any) => {
            return (
              <List.Item className={`!p-0 flex justify-between !items-end`}>
                <div style={{ color: item.color }}>{item.label}</div>
                <div style={{ color: item.color }}>{item.value}</div>
              </List.Item>
            );
          }}
        />
      ),
      type: "group",
    },
    {
      key: "manage",
      label: t("partner/menu/manage"),
      style: {
        borderRadius: '10px',
        border: '1px solid #09188962',
        paddingLeft: '0px',
        paddingRight: '10px',
        marginLeft: '16px',
        marginRight: "16px",
        marginTop: '10px',
        backgroundColor:'#002140'
      },
      type: "group",
    },
    {
      key: "partner/mySettlementManagement",
      label: t("partner/menu/mySettlementManagement"),
      icon: <CalculatorOutlined />,
      children: [
        {
          key: "partner/mySettlementManagement/myDepositWidthdrawal",
          label: t(`partner/menu/mySettlementManagement/myDepositWidthdrawal`),
        },
        {
          key: "partner/mySettlementManagement/rollingTransaction",
          label: t(`partner/menu/mySettlementManagement/rollingTransaction`),
        },
        {
          key: "partner/mySettlementManagement/pointConversion",
          label: t(`partner/menu/mySettlementManagement/pointConversion`),
        },
        // {
        //   key: "partner/mySettlementManagement/settlementDetails",
        //   label: t(`partner/menu/mySettlementManagement/settlementDetails`),
        // },
        {
          key: "partner/mySettlementManagement/moneyHistory",
          label: t(`partner/menu/mySettlementManagement/moneyHistory`),
        },
        {
          key: "partner/mySettlementManagement/pointDetails",
          label: t(`partner/menu/mySettlementManagement/pointDetails`),
        },
        {
          key: "partner/mySettlementManagement/rollingHistory",
          label: t(`partner/menu/mySettlementManagement/rollingHistory`),
        }
      ],
    },
    {
      key: "partner/sub-management",
      label: t("partner/menu/sub-management"),
      icon: <SiDistrokid />,
      children: [
        {
          key: "partner/sub-management/sub-member-list",
          label: t("partner/menu/sub-member-list"),
        },
        {
          key: "partner/sub-management/sub-distributor",
          label: t("partner/menu/sub-distributor"),
        },
      ],
    },
    {
      key: "partner/member-management",
      label: t("partner/menu/member-management"),
      icon: <FaUsersGear />,
      children: [
        {
          key: "partner/member-management/directMemberList",
          label: t("partner/menu/directMemberList"),
        },
        {
          key: "partner/member-management/directMemberDepositWithdrawal",
          label: t(`partner/menu/directMemberDepositWithdrawal`),
        },
        {
          key: "partner/member-management/entireMemberDepositWithdrawal",
          label: t(`partner/menu/entireMemberDepositWithdrawal`),
        },
        {
          key: "partner/member-management/directMemberPointsDetails",
          label: t(`partner/menu/directMemberPointsDetails`),
        },
        {
          key: "partner/member-management/integratedMoneyTransferHistory",
          label: t(`partner/menu/integratedMoneyTransferHistory`),
        },
        {
          key: "partner/member-management/connectedMember",
          label: t(`partner/menu/connectedMember`),
        },
        {
          key: "partner/member-management/waitingForMemberApproval",
          label: t(`partner/menu/waitingForMemberApproval`),
        },
      ],
    },
    {
      key: "game",
      label: t("partner/menu/game"),
      type: "group",
      style: {
        borderRadius: '10px',
        border: '1px solid #09188962',
        paddingLeft: '0px',
        paddingRight: '10px',
        marginLeft: '16px',
        marginRight: "16px",
        marginTop: '10px',
        backgroundColor:'#002140'
      },
    },
    {
      key: "partner/game/bettingstatus",
      label: t("partner/menu/bettingStatus"),
      icon: <FaFootball />,
      children: [
        {
          key: "partner/game/bettingstatus/casino",
          label: t("partner/menu/casinoStatus"),
        },
        {
          key: "partner/game/bettingstatus/slot",
          label: t("partner/menu/slotStatus"),
        },
        {
          key: "partner/game/bettingstatus/miniGame",
          label: t("partner/menu/miniGameStatus"),
        },
      ],
    },
    {
      key: "board",
      label: t("partner/menu/board"),
      type: "group",
      style: {
        borderRadius: '10px',
        border: '1px solid #09188962',
        paddingLeft: '0px',
        paddingRight: '10px',
        marginLeft: '16px',
        marginRight: "16px",
        marginTop: '10px',
        backgroundColor:'#002140'
      },
    },
    {
      key: "partner/support",
      label: t("partner/menu/customSupport"),
      icon: <BiSupport />,
      children: [
        {
          key: "partner/support/center",
          label: t("partner/menu/customServiceCenter"),
        },
      ],
    },
    {
      key: "partner/noteManagement",
      label: t("partner/menu/noteManagement"),
      icon: <InboxOutlined />,
      children: [
        {
          key: "partner/noteManagement/myNotes",
          label: t("partner/menu/noteManagement/myNotes"),
        },
      ],
    },
  ];

  const profileItems: MenuProps["items"] = [
    {
      key: "myprofile",
      icon: <UserOutlined />,
      label: t(`profile`),
    },
    {
      key: "setting",
      icon: <SettingOutlined />,
      label: t(`setting`),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: t(`logout`),
      onClick: onLogout,
    },
  ];

  const onThemeChange = () => {
    if (!isDarkTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setDarkTheme(!isDarkTheme);
  };
  const onMenuClick = (e: MenuInfo) => {
    setSelectedkeys(e.keyPath);
    router.push("/" + e.key);
    // router.push("/" + e.keyPath.reverse().join("/"));
  };

  // Recursive search for current item
  const findActiveMenuItem: any = (items: any[], pathname: string) => {
    for (const item of items) {
      if (item.key === pathname) {
        return item;
      }

      if (item.children) {
        const found = findActiveMenuItem(item.children, pathname);
        if (found) return found;
      }
    }

    return null;
  };

  useEffect(() => {
    api("user/me")
      .then((result) => {
        if (result.data.role === "A") {
          setAdmin(true);
          setPartner(false);
          setUser(result.data);
          // router.push(ROUTES.admin.home);
        } else if (result.data.role == "P") {
          setAdmin(false);
          setPartner(true);
          setUser(result.data);
        } else {
          setAdmin(false);
          setPartner(false);
          router.push(ROUTES.partner.login);
          notiApi.error({
            message: "Error",
            description: "You are not able to access to Partner page!",
          });
        }
        localStorage.setItem("token", result.token);
      })
      .catch(() => {
        router.push(ROUTES.partner.login);
      });
    return () => {};
  }, []);

  useEffect(() => {
    setMount(true);
    setDarkTheme(false);
    document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    if (currentUser?.role === "A") {
      setAdmin(true);
      setPartner(false);
    } else if (currentUser?.role === "P") {
      setAdmin(false);
      setPartner(true);
    } else {
      setAdmin(false);
      setPartner(false);
    }
  }, [currentUser]);
  useEffect(() => {
    setSelectedkeys(breadcrumbMenu);
    const d = breadcrumbMenu
      ?.map((b) => findActiveMenuItem(sideBarItems, b))
      .filter(Boolean);
    setCurrentMenuItems(d);
  }, [breadcrumbMenu, locale]);
  return mounted ? (
    <ApolloProvider client={client}>
      <ConfigProvider
        componentSize="small"
        theme={{
          token: {
            borderRadius: 0,
            motion: false,
            fontSize: 12,
          },
          components: {
            Card: {
              headerHeight: 40,
              bodyPadding: 16,
            },
          },
          algorithm: isDarkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        {contextHolder}

        {
          pathname.includes('/partner/popup') || pathname.includes('/partner/auth/login') ? (
            <>{children}</>
          ) : (
            <LayoutContext.Provider
          value={{ isDarkTheme, collapsed, setCollapsed }}
        >
          <Layout>
            <RouteTracker />
            <audio src="/wav/alarm.wav" controls className="hidden"></audio>
            {isPartner ? (
              <Sider
                className="h-screen !absolute md:!relative z-50 top-0"
                style={{
                  borderTopRightRadius: '25px',
                }}
                breakpoint="md"
                collapsedWidth="0"
                collapsed={collapsed}
                // onBreakpoint={(broken) => {
                //   console.log(broken);
                // }}
                onCollapse={(collapsed) => {
                  setCollapsed(collapsed);
                }}
              >
                <Space
                  direction="vertical"
                  className="w-full h-screen overflow-y-auto hide-scrollbar"
                  style={{
                    borderTopRightRadius: '25px',
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none', /* IE and Edge */
                  }}
                >
                  <div
                    className="h-10 justify-center items-center text-center p-6 cursor-pointer flex"
                    onClick={() => {
                      setSelectedkeys(["partner"]);
                      router.push("/partner");
                    }}
                  >
                    <Image src={Logo} height={50} className="mt-3" alt="Toto Admin" />
                  </div>

                  <div className="px-4 py-3 text-center border-b border-white/10">
                    <p className="text-xs text-white/70 uppercase tracking-wider mb-1.5">
                      {t("onlinePartner")}
                    </p>
                    <p className="text-sm text-white font-medium">
                      {currentUser.userid} <span className="text-white/60">({currentUser.name})</span>
                    </p>
                  </div>
                  <p className="text-white px-6 mt-3">{t("home")}</p>
                  <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={["home"]}
                    selectedKeys={selectedkeys}
                    items={sideBarItems}
                    onClick={onMenuClick}
                    defaultOpenKeys={selectedkeys}
                    className="!text-white"
                    style={{
                      marginTop: '-10px'
                    }}
                  />
                </Space>
              </Sider>
            ) : null}
            <Layout className="min-h-screen">
              {isPartner ? (
                <Header
                  className="w-full !px-2 flex !h-12 items-center !leading-10"
                  style={{ background: isDarkTheme ? "" : colorBgContainer }}
                >
                  <Button
                    type="text"
                    icon={
                      collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
                    }
                    onClick={() => setCollapsed(!collapsed)}
                    className="!w-10 !h-10 !hidden lg:!block"
                  />
                  <Flex className="px-2 overflow-x-auto w-full">
                    <Space.Compact  
                      direction="vertical"
                      className="gap-0.5 text-center"
                    >
                      <table style={{ 
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        fontSize: '12px',
                        backgroundColor: '#ffffff',
                        minWidth: '400px',
                        borderCollapse: 'separate',
                        borderSpacing: '0',
                        marginRight: '10px',
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f5f5f5', border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '0px', minWidth: '60px', height: '18px' }}>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("depositRequest")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("withdrawRequest")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("rollingConversion")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("membershipInquiry")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("note")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("inquiry")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ height: '18px' }}>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: newNotifications.registeredUsers ? '#ff0000' : 'inherit', fontWeight: newNotifications.registeredUsers ? 'bold' : 'normal' }} onClick={() => window.open('/partner/member-management/directMemberDepositWithdrawal', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.registeredUsers || 0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: newNotifications.numberOfDepositorsToday ? '#ff0000' : 'inherit', fontWeight: newNotifications.numberOfDepositorsToday ? 'bold' : 'normal' }} onClick={() => window.open('/partner/member-management/directMemberDepositWithdrawal', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.numberOfDepositorsToday || 0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: newNotifications.numberOfWithdrawalToday ? '#ff0000' : 'inherit', fontWeight: newNotifications.numberOfWithdrawalToday ? 'bold' : 'normal' }} onClick={() => window.open('/partner/member-management/integratedMoneyTransferHistory', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.numberOfWithdrawalToday || 0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: newNotifications.membershipInquiry ? '#ff0000' : 'inherit', fontWeight: newNotifications.membershipInquiry ? 'bold' : 'normal' }} onClick={() => window.open('/partner/support/center', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.membershipInquiry || 0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: newNotifications.rollingTransition ? '#ff0000' : 'inherit', fontWeight: newNotifications.rollingTransition ? 'bold' : 'normal' }} onClick={() => window.open('/partner/noteManagement/myNotes', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.rollingTransition || 0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: newNotifications.depositToday ? '#ff0000' : 'inherit', fontWeight: newNotifications.depositToday ? 'bold' : 'normal' }} onClick={() => window.open('/partner/support/center', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.inquiry || 0}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Space.Compact>
                    <Space.Compact className="flex justify-end w-full items-center gap-2">
                      <Button 
                        className="bg-red-500 text-white"
                        onClick={() => router.push("/partner/deposit-request")}
                      >
                        {t("depoistRequest")}
                      </Button>
                      <Button 
                        className="bg-blue-500 text-white"
                        onClick={() => router.push("/partner/withdraw-request")}
                      >
                        {t("withdrawRequest")}
                      </Button>
                      <Button 
                        className="bg-green-500 text-white"
                        onClick={() => router.push("/partner/rolling-transition")}
                      >
                        {t("rollingTransition")}
                      </Button>
                      <Button 
                        className="bg-purple-500 text-white"
                        onClick={() => router.push("/partner/point-conversion")}
                      >
                        {t("pointConversion")}
                      </Button>
                    </Space.Compact>
                    
                  </Flex>
                  <Flex
                    align="flex-end"
                    justify="space-between"
                    className="gap-2 items-center"
                  >
                    <LangSwitcher locale={locale} />
                    {/* <Button
                      type="text"
                      icon={isDarkTheme ? <SunOutlined /> : <MoonOutlined />}
                      onClick={onThemeChange}
                      className="!w-10 !h-10"
                    /> */}
                    <Dropdown
                      className="flex gap-2 items-center"
                      menu={{ items: profileItems }}
                      placement="bottomRight"
                      trigger={["click"]}
                    >
                      <Button type="text" className="!h-10">
                        <Avatar icon={<UserOutlined />} className="w-8 h-8" />
                        <span className="hidden lg:block">
                          {currentUser.name}
                        </span>
                      </Button>
                    </Dropdown>
                  </Flex>
                </Header>
              ) : null}
              {isPartner ? (
                <>
                  <Breadcrumb
                    className="!p-2 shadow flex w-full items-center breadcrumb-home"
                    items={[
                      {
                        title: (
                          <Link
                            href="/partner"
                            className="flex justify-center items-center gap-2"
                          >
                            <HomeOutlined /> {t("home")}
                          </Link>
                        ),
                      },
                      ...(currentMenuItems?.map((c: any) => ({
                        title: c.label,
                      })) ?? []),
                    ]}
                  />
                </>
              ) : null}
              <Content className="p-2">{children}</Content>
            </Layout>
          </Layout>
        </LayoutContext.Provider>
          )
        }
      </ConfigProvider>
    </ApolloProvider>
  ) : (
    <div className="flex justify-center bg-[#0b0600] items-center h-screen">
      <Image src={Loading} alt="Toto Admin" width={70} height={70} className="animate-spin" />
    </div>
  );
}
