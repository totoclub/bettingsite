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

import Loading from "@/assets/img/main/loader.png";

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
  BellOutlined,
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
import AdminLogo from "@/assets/img/Adminlogo.png"
import NotificationButton from "./NotificationButton";

const { Header, Sider } = Layout;

export default function AdminRootLayout({
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



  useEffect(() => {
    setPathname(window.location.pathname);
    fetchInfo();
    // fetchHonorLinkBalance();
  }, []);

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
    api("admin/dashboard/get-data", {
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
        console.log(res.stats.honorLinkBalance, res.stats, "res.data");
        setTimeout(() => {
          fetchInfo();
        }, 3000);
      }
    });
  };


  const data = [
    {
      label: t("honorLink"),
      value: formatNumber(Number(info.honorLinkBalance) || 0) + t("egg"),
      color: "cyan",
    },
    {
      label: t("depositToday"),
      value: formatNumber(Number(info.depositToday) || 0),
      color: "lightgreen",
    },
    {
      label: t("withdrawlToday"),
      value: formatNumber(Number(info.withdrawToday) || 0),
      color: "tomato",
    },
    {
      label: t("bettingToday"),
      value: formatNumber(Number(info.bettingToday) || 0),
      color: "lightgreen",
    },
    {
      label: t("todaysWinner"),
      value: formatNumber(Number(info.todayWinners) || 0),
      color: "yellow",
    },
    {
      label: t("userAmount"),
      value: formatNumber(Number(info.totalBalance) || 0),
      color: "tomato",
    },
    {
      label: t("userPoints"),
      value: formatNumber(Number(info.totalPoints) || 0),
      color: "lightgreen",
    },
    {
      label: t("totalAmountOfDistributionReserves"),
      value: formatNumber(0),
      color: "yellow",
    },
    {
      label: t("totalPoints"),
      value: formatNumber(Number(info.totalPoints) || 0),
      color: "yellow",
    },
    {
      label: t("totalLoss"),
      value: formatNumber(Number(info.totalLoss) || 0),
      color: "yellow",
    },
    {
      label: t("rollingTheTotal"),
      value: formatNumber(Number(info.rollingTotal) || 0),
      color: "yellow",
    },
    {
      label: t("totalSalesLossToday"),
      value: formatNumber(Number(info.totalSalesLossToday) || 0),
      color: "tomato",
    },
    {
      label: t("todaysDistributionRolling"),
      value: formatNumber(0),
      color: "tomato",
    },
    {
      label: t("sportsPendingBetting"),
      value: formatNumber(Number(info.sportsPendingBetting) || 0),
      color: "lightgreen",
    },

    {
      label: t("sportsRebateBetting"),
      value: formatNumber(Number(info.sportsRebateBetting) || 0),
      color: "lightgreen",
    },

  ];

  const onLogout = () => {
    api("auth/logout", { method: "POST" }).then(() => {
      setUser({});
      localStorage.removeItem("token");
      router.push(ROUTES.admin.login);
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
      label: t("admin/menu/administrations"),
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
      key: "admin/settlements",
      label: t("admin/menu/settlements"),
      icon: <CalculatorOutlined />,
      children: [
        {
          key: "admin/settlements/rollingconversionhistory",
          label: t(`admin/menu/settlements/rollingconversionhistory`),
        },
        {
          key: "admin/settlements/fullpointshistory",
          label: t(`admin/menu/settlements/fullpointshistory`),
        },
        // {
        //   key: "admin/settlements/fullcoupondetail",
        //   label: t(`admin/menu/settlements/fullcoupondetail`),
        // },
        {
          key: "admin/settlements/rollingaccumulationhistory",
          label: t(`admin/menu/settlements/rollingaccumulationhistory`),
        },
        // {
        //   key: "admin/settlements/losingaccumulationhistory",
        //   label: t(`admin/menu/settlements/losingaccumulationhistory`),
        // },
        // {
        //   key: "admin/settlements/losingdetail",
        //   label: t(`admin/menu/settlements/losingdetail`),
        // },
        {
          key: "admin/settlements/distributorstatistics",
          label: t(`admin/menu/settlements/distributorStatistics`),
        },
        {
          key: "admin/settlements/distributorstatisticsdetail",
          label: t(`admin/menu/settlements/distributorStatisticsDetail`),
        },
      ],
    },
    {
      key: "admin/financals",
      label: t("admin/menu/financals"),
      icon: <BiDiamond />,
      children: [
        {
          key: "admin/financals/general",
          label: t("admin/menu/generaldwdetail"),
        },
        {
          key: "admin/financals/memberdwhistory",
          label: t("admin/menu/memberdwhistory"),
        },
        {
          key: "admin/financals/totaltransferhistory",
          label: t("admin/menu/totaltransferhistory"),
        },
        {
          key: "admin/financals/membertransferhistory",
          label: t("admin/menu/membertransferhistory"),
        },
        {
          key: "admin/financals/integratedtransferhistory",
          label: t("admin/menu/integratedtransferhistory"),
        },
      ],
    },
    {
      key: "admin/partners",
      label: t("admin/menu/partners"),
      icon: <SiDistrokid />,
      children: [
        {
          key: "admin/partners/distributor",
          label: t("admin/menu/partners"),
        },
        {
          key: "admin/partners/status",
          label: t("admin/menu/partnerStatus"),
        },
        {
          key: "admin/partners/domain",
          label: t("admin/menu/partnerDomain"),
        },
      ],
    },
    {
      key: "admin/users",
      label: t("admin/menu/users"),
      icon: <FaUsersGear />,
      children: [
        {
          key: "admin/users/main",
          label: t("admin/menu/users"),
        },
        {
          key: "admin/users/pending",
          label: t(`admin/menu/pendings`),
        },
        {
          key: "admin/users/blocked",
          label: t(`admin/menu/blocked`),
        },
        {
          key: "admin/users/status",
          label: t(`admin/menu/userStatus`),
        },
        {
          key: "admin/users/smslog",
          label: t(`admin/menu/smslogs`),
        },
        {
          key: "admin/users/activity",
          label: t(`admin/menu/activity`),
        },
      ],
    },
    {
      key: "admin/admin",
      label: t("admin/menu/admin"),
      icon: <GrUserAdmin />,
      children: [
        {
          key: "admin/admin/admin",
          label: t("admin/menu/admin"),
        },
        {
          key: "admin/admin/status",
          label: t("admin/menu/adminStatus"),
        },
        {
          key: "admin/admin/log",
          label: t("admin/menu/adminLog"),
        },
      ],
    },
    {
      key: "admin/settings",
      label: t("admin/menu/settings"),
      icon: <SettingOutlined />,
      children: [
        // {
        //   key: "admin/settings/site",
        //   label: t("admin/menu/siteSetting"),
        // },
        // {
        //   key: "admin/settings/global",
        //   label: t("admin/menu/globalSetting"),
        // },
        // {
        //   key: "admin/settings/design",
        //   label: t("admin/menu/designSetting"),
        // },
        // {
        //   key: "admin/settings/menu",
        //   label: t("admin/menu/menuSetting"),
        // },
        {
          key: "admin/settings/domain",
          label: t("admin/menu/domainSetting"),
        },
        {
          key: "admin/settings/contact",
          label: t("admin/menu/contactSetting"),
        },
        // {
        //   key: "admin/settings/sms",
        //   label: t("admin/menu/smsAPISetting"),
        // },
        // {
        //   key: "admin/settings/alarm",
        //   label: t("admin/menu/alarmSetting"),
        // },
        {
          key: "admin/settings/popup",
          label: t("admin/menu/popupSetting"),
        },
        {
          key: "admin/settings/bank",
          label: t("admin/menu/bankSetting"),
        },
        {
          key: "admin/settings/level",
          label: t("admin/menu/levelSetting"),
        }
      ],
    },
    {
      key: "game",
      label: t("admin/menu/game"),
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
    // {
    //   key: "admin/game/casino",
    //   label: t("admin/menu/casino"),
    //   icon: <FaFootball />,
    //   children: [
    //     {
    //       key: "admin/game/casino/live",
    //       label: t("admin/menu/casinoLive"),
    //     },
    //     {
    //       key: "admin/game/casino/slot",
    //       label: t("admin/menu/casinoSlot"),
    //     },
    //     {
    //       key: "admin/game/casino/poker",
    //       label: t("admin/menu/casinoPoker"),
    //     },
    //   ],
    // },

    // {
    //   key: "admin/game/api",
    //   label: t("admin/menu/gameapi"),
    //   icon: <FaFootball />,
    //   children: [
    //     // {
    //     //   key: "admin/game/api/honorlink",
    //     //   label: t("admin/menu/gameapi/honorlink"),
    //     // },
    //     // {
    //     //   key: "admin/game/api/khan",
    //     //   label: t("admin/menu/gameapi/khan"),
    //     // },
    //     // {
    //     //   key: "admin/game/api/redfox",
    //     //   label: t("admin/menu/gameapi/redfox"),
    //     // },
    //     // {
    //     //   key: "admin/game/api/revolution",
    //     //   label: t("admin/menu/gameapi/revolution"),
    //     // },
    //     // {
    //     //   key: "admin/game/api/slotcity",
    //     //   label: t("admin/menu/gameapi/slotcity"),
    //     // },
    //     // {
    //     //   key: "admin/game/api/swix",
    //     //   label: t("admin/menu/gameapi/swix"),
    //     // },
    //     // {
    //     //   key: "admin/game/api/wildgames",
    //     //   label: t("admin/menu/gameapi/wildgames"),
    //     // },
    //   ],
    // },
    {
      key: "admin/game/mini",
      label: t("admin/menu/miniManagement"),
      icon: <FaFootball />,
      children: [
        {
          key: "admin/game/mini/eos1min",
          label: t("admin/menu/miniManagement/eos1min"),
        },
        {
          key: "admin/game/mini/eos2min",
          label: t("admin/menu/miniManagement/eos2min"),
        },
        {
          key: "admin/game/mini/eos3min",
          label: t("admin/menu/miniManagement/eos3min"),
        },
        {
          key: "admin/game/mini/eos4min",
          label: t("admin/menu/miniManagement/eos4min"),
        },
        {
          key: "admin/game/mini/eos5min",
          label: t("admin/menu/miniManagement/eos5min"),
        },
        // {
        //   key: "admin/game/mini/bepick",
        //   label: t("admin/menu/miniManagement/bepick"),
        // },
        // {
        //   key: "admin/game/mini/eos",
        //   label: t("admin/menu/miniManagement/eos"),
        // },
        // {
        //   key: "admin/game/mini/pbg",
        //   label: t("admin/menu/miniManagement/pbg"),
        // },
        // {
        //   key: "admin/game/mini/dhpowerball",
        //   label: t("admin/menu/miniManagement/dhpowerball"),
        // },
      ],
    },
    // {
    //   key: "admin/game/sports",
    //   label: t("admin/menu/sports"),
    //   icon: <FaFootball />,
    //   children: [
    //     {
    //       key: "admin/game/sports/settings",
    //       label: t("admin/menu/sportsSettings"),
    //     },
    //     {
    //       key: "admin/game/sports/betting",
    //       label: t("admin/menu/sportsBettingInformation"),
    //     },
    //     {
    //       key: "admin/game/sports/basic",
    //       label: t("admin/menu/sportsBasic"),
    //     },
    //     {
    //       key: "admin/game/sports/countryOrder",
    //       label: t("admin/menu/sportsCountryOrder"),
    //     },
    //     {
    //       key: "admin/game/sports/mainEvent",
    //       label: t("admin/menu/mainEventSettings"),
    //     },
    //     {
    //       key: "admin/game/sports/market",
    //       label: t("admin/menu/marketSettings"),
    //     },
    //     {
    //       key: "admin/game/sports/marketCombinedBetting",
    //       label: t("admin/menu/marketCombinedBetting"),
    //     },
    //     {
    //       key: "admin/game/sports/matchManagementAuto",
    //       label: t("admin/menu/matchManagementAuto"),
    //     },
    //     {
    //       key: "admin/game/sports/matchManagementLive",
    //       label: t("admin/menu/matchManagementLive"),
    //     },
    //     {
    //       key: "admin/game/sports/matchManagementManual",
    //       label: t("admin/menu/matchManagementManual"),
    //     },
    //     {
    //       key: "admin/game/sports/matchEndsAuto",
    //       label: t("admin/menu/matchEndsAuto"),
    //     },
    //     {
    //       key: "admin/game/sports/matchEndsLive",
    //       label: t("admin/menu/matchEndsLive"),
    //     },
    //     {
    //       key: "admin/game/sports/matchEndsManual",
    //       label: t("admin/menu/matchEndsManual"),
    //     },
    //     {
    //       key: "admin/game/sports/recalibrationBetting",
    //       label: t("admin/menu/recalibrationBetting"),
    //     },
    //     {
    //       key: "admin/game/sports/recalibrationMarket",
    //       label: t("admin/menu/recalibrationMarket"),
    //     },
    //     {
    //       key: "admin/game/sports/matchManagementChangeHistory",
    //       label: t("admin/menu/matchManagementHistory"),
    //     }
    //   ],
    // },
    // {
    //   key: "admin/game/virtual",
    //   label: t("admin/menu/virtual"),
    //   icon: <FaFootball />,
    //   children: [
    //     {
    //       key: "admin/game/virtual/setting",
    //       label: t("admin/menu/virtual"),
    //     },
    //   ],
    // },
    // {
    //   key: "admin/game/lotus",
    //   label: t("admin/menu/lotus"),
    //   icon: <FaFootball />,
    //   children: [
    //     {
    //       key: "admin/game/lotus/setting",
    //       label: t("admin/menu/lotus"),
    //     },
    //   ],
    // },
    // {
    //   key: "admin/game/mgm",
    //   label: t("admin/menu/mgm"),
    //   icon: <FaFootball />,
    //   children: [
    //     {
    //       key: "admin/game/mgm/setting",
    //       label: t("admin/menu/mgm"),
    //     },
    //   ],
    // },
    // {
    //   key: "admin/game/touch",
    //   label: t("admin/menu/touch"),
    //   icon: <FaFootball />,
    //   children: [
    //     {
    //       key: "admin/game/touch/setting",
    //       label: t("admin/menu/touch"),
    //     },
    //   ],
    // },
    {
      key: "admin/game/bettingstatus",
      label: t("admin/menu/bettingStatus"),
      icon: <FaFootball />,
      children: [
        {
          key: "admin/game/bettingstatus/casinoLive",
          label: t("admin/menu/bettingStatus/casinoLive"),
        },
        {
          key: "admin/game/bettingstatus/casinoSlot",
          label: t("admin/menu/bettingStatus/casinoSlot"),
        },
        {
          key: "admin/game/bettingstatus/miniGame",
          label: t("admin/menu/bettingStatus/miniGame"),
        },
      ],
    },
    {
      key: "board",
      label: t("admin/menu/board"),
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
      key: "admin/board",
      label: t("admin/menu/bulletins"),
      icon: <MdAnnouncement />,
      children: [
        {
          key: "admin/board/notifications",
          label: t("admin/menu/notifications"),
        },
        {
          key: "admin/board/events",
          label: t("admin/menu/events"),
        },
        // {
        //   key: "admin/board/bulletin",
        //   label: t("admin/menu/bulletin"),
        // },
        {
          key: "admin/board/comments",
          label: t("admin/menu/comments"),
        },
      ],
    },
    {
      key: "admin/support",
      label: t("admin/menu/customSupport"),
      icon: <BiSupport />,
      children: [
        {
          key: "admin/support/center",
          label: t("admin/menu/customServiceCenter"),
        },
        {
          key: "admin/support/sample",
          label: t("admin/menu/serviceCenterSample"),
        },
      ],
    },
    {
      key: "admin/inbox",
      label: t("admin/menu/inbox"),
      icon: <InboxOutlined />,
      children: [
        {
          key: "admin/inbox/custom",
          label: t("admin/menu/noteList"),
        },
        // {
        //   key: "admin/inbox/group",
        //   label: t("admin/menu/groupMessageList"),
        // },
        // {
        //   key: "admin/inbox/sample",
        //   label: t("admin/menu/simpleNote"),
        // },
      ],
    },
    // {
    //   key: "admin/statistical",
    //   label: t("admin/menu/statistical"),
    //   icon: <InboxOutlined />,
    //   children: [
    //     {
    //       key: "admin/statistical/headOfficeSettlementStatement",
    //       label: t("admin/menu/headOfficeSettlementStatement"),
    //     },
    //     {
    //       key: "admin/statistical/siteStatistics",
    //       label: t("admin/menu/siteStatistics"),
    //     },
    //     {
    //       key: "admin/statistical/generalDistributorDailyStatistics",
    //       label: t("admin/menu/generalDistributorDailyStatistics"),
    //     },
    //     {
    //       key: "admin/statistical/statisticsByDistributor",
    //       label: t("admin/menu/statisticsByDistributor"),
    //     },
    //     {
    //       key: "admin/statistical/attendanceStatistics",
    //       label: t("admin/menu/attendanceStatistics"),
    //     },
    //     {
    //       key: "admin/statistical/stepByStepStatistics",
    //       label: t("admin/menu/stepByStepStatistics"),
    //     },
    //   ],
    // },
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
        } else if (result.data.role === "P") {
          setAdmin(false);
          setPartner(true);
          setUser(result.data);
        } else {
          setAdmin(false);
          setPartner(false);
          router.push(ROUTES.admin.login);
          notiApi.error({
            message: "Error",
            description: "You are not able to access to Admin page!",
          });
        }
        localStorage.setItem("token", result.token);
      })
      .catch(() => {
        router.push(ROUTES.admin.login);
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
          pathname.includes('/admin/popup') ? (
            <>{children}</>
          ) : (
            <LayoutContext.Provider
          value={{ isDarkTheme, collapsed, setCollapsed }}
        >
          <Layout>
            <RouteTracker />
            <audio src="/wav/alarm.wav" controls className="hidden"></audio>
            {isAdmin ? (
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
                      setSelectedkeys(["admin"]);
                      router.push("/admin");
                    }}
                  >
                    <Image src={AdminLogo} height={50} className="mt-3" alt="Toto Admin" />
                  </div>
                  <p className="text-white px-6 mt-3">{t("home")}</p>
                  <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={["admin"]}
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
              {isAdmin ? (
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
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("membership")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("membershipDeposit")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("membershipWithdraw")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("membershipInquiry")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("rollingConversion")}</th>
                            {/* <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("totalDeposit")}</th> */}
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("distributorInquiry")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("totalSettlement")}</th>
                            {/* <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("totalSettlement")}</th> */}
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ height: '18px' }}>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: newNotifications.registeredUsers ? '#ff0000' : 'inherit', fontWeight: newNotifications.registeredUsers ? 'bold' : 'normal' }} onClick={() => window.open('/admin/popup/member-join', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.registeredUsers || 0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: newNotifications.numberOfDepositorsToday ? '#ff0000' : 'inherit', fontWeight: newNotifications.numberOfDepositorsToday ? 'bold' : 'normal' }} onClick={() => window.open('/admin/popup/member-deposit', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.numberOfDepositorsToday || 0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: newNotifications.numberOfWithdrawalToday ? '#ff0000' : 'inherit', fontWeight: newNotifications.numberOfWithdrawalToday ? 'bold' : 'normal' }} onClick={() => window.open('/admin/popup/member-withdraw', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.numberOfWithdrawalToday || 0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: newNotifications.membershipInquiry ? '#ff0000' : 'inherit', fontWeight: newNotifications.membershipInquiry ? 'bold' : 'normal' }} onClick={() => window.open('/admin/popup/member-support', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.membershipInquiry || 0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: newNotifications.rollingTransition ? '#ff0000' : 'inherit', fontWeight: newNotifications.rollingTransition ? 'bold' : 'normal' }} onClick={() => window.open('/admin/popup/rolling-conversion', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.rollingTransition || 0}</td>
                            {/* <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: newNotifications.depositToday ? '#ff0000' : 'inherit', fontWeight: newNotifications.depositToday ? 'bold' : 'normal' }} onClick={() => window.open('/admin/popup/member-deposit', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.depositToday || 0}</td> */}
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: newNotifications.withdrawToday ? '#ff0000' : 'inherit', fontWeight: newNotifications.withdrawToday ? 'bold' : 'normal' }} onClick={() => window.open('/admin/popup/distributor-inquiry', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.membershipInquiry || 0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: newNotifications.membershipInquiry ? '#ff0000' : 'inherit', fontWeight: newNotifications.membershipInquiry ? 'bold' : 'normal' }} onClick={() => window.open('/admin/popup/total-settlement', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.totalSettlement || 0}</td>
                            {/* <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer' }} onClick={() => window.open('/admin/popup/total-settlement', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.totalSettlement || 0}</td> */}
                          </tr>
                        </tbody>
                      </table>
                    </Space.Compact>
                    <Space.Compact direction="vertical" className="gap-0.5">
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
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("notificationLive")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("notificationMini")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("notificationVirtual")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("notificationMGM")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("notificationSportsLive")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("sportRebateList")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("notificationSlot")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("notificationSport")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("notificationLotus")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("notificationTouch")}</th>
                            <th style={{border: '1px solid #d9d9d9', fontWeight: 'normal', padding: '2px 4px', minWidth: '60px', height: '18px', lineHeight: '14px', textWrap: 'nowrap' }}>{t("interestedMemberBetting")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ height: '18px' }}>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: '#000000', fontWeight: 'normal' }} onClick={() => window.open('/', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: '#000000', fontWeight: 'normal' }} onClick={() => window.open('/', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: '#000000', fontWeight: 'normal' }} onClick={() => window.open('/', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: '#000000', fontWeight: 'normal' }} onClick={() => window.open('/', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>0</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: '#000000', fontWeight: 'normal' }} onClick={() => window.open('/admin/popup/sports-bet-alert', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{ 0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', color: '#000000', fontWeight: 'normal' }}>0</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: '#000000', fontWeight: 'normal' }} onClick={() => window.open('/', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: '#000000', fontWeight: 'normal' }} onClick={() => window.open('/', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: '#000000', fontWeight: 'normal' }} onClick={() => window.open('/', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: '#000000', fontWeight: 'normal' }} onClick={() => window.open('/', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{0}</td>
                            <td style={{border: '1px solid #d9d9d9', padding: '2px 4px', textAlign: 'center', height: '18px', lineHeight: '14px', cursor: 'pointer', color: (newNotifications.numberOfBettingMembersToday || newNotifications.numberOfBetsToday) ? '#ff0000' : '#000000', fontWeight: (newNotifications.numberOfBettingMembersToday || newNotifications.numberOfBetsToday) ? 'bold' : 'normal' }} onClick={() => window.open('/', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{info.numberOfBettingMembersToday || 0}/{info.numberOfBetsToday || 0}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Space.Compact>
                  </Flex>
                  <Flex
                    align="flex-end"
                    justify="space-between"
                    className="gap-2 items-center"
                  >
                    <LangSwitcher locale={locale}/>
                    <Button
                      type="text"
                      icon={isDarkTheme ? <SunOutlined /> : ""}
                      onClick={onThemeChange}
                      className="!w-10 !h-10 !hidden"
                    />
                    {/* notification button */}
                    <NotificationButton />
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
              {isAdmin ? (
                <>
                  <Breadcrumb
                    className="!p-2 shadow flex w-full items-center breadcrumb-home"
                    items={[
                      {
                        title: (
                          <Link
                            href="/admin"
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
                  <Space.Compact className="justify-center items-center mr-3 header-admin-layout-tag">
                    <Tag style={{backgroundColor: 'white', border: '1px solid transparent'}} className="!me-0.5" onClick={() => window.open('/admin/admin/status', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{t("connectedUsers")}:{info.connectedUsers || 0}</Tag>
                    {/* <Tag style={{backgroundColor: 'white', border: '1px solid transparent'}} className="!me-0.5" onClick={() => window.open('/admin/popup/member-join', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{t("todaysSubscribers")}:{info.todaysSubscribers || 0}</Tag> */}
                    <Tag style={{backgroundColor: 'white', border: '1px solid transparent'}} className="!me-0.5" onClick={() => window.open('/admin/financals/totaltransferhistory', '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no')}>{t("todaysWithdrawal")}:{info.todaysWithdrawal || 0}</Tag>
                    <Tag style={{backgroundColor: 'white', border: '1px solid transparent'}} className="!me-0.5" >{t("registeredUsers")}:{info.registeredUsersCount || 0}</Tag>
                    <Tag style={{backgroundColor: 'white', border: '1px solid transparent'}} className="!me-0.5" >{t("firstDeposit")}:{info.firstDeposit || 0}</Tag>
                    <Tag style={{backgroundColor: 'white', border: '1px solid transparent'}} className="!me-0.5" >{t("numberOfLoginFailures")}:{info.numberOfLoginFailures || 0}</Tag>
                    <Tag style={{backgroundColor: 'white', border: '1px solid transparent'}} className="!me-0.5" >{t("numberOfDepositorsToday")}:{info.numberOfDepositorsToday || 0}</Tag>
                    <Tag style={{backgroundColor: 'white', border: '1px solid transparent'}} className="!me-0.5" >{t("numberOfWithdrawalToday")}:{info.numberOfWithdrawalToday || 0}</Tag>
                    <Tag style={{backgroundColor: 'white', border: '1px solid transparent'}} className="!me-0.5" >{t("numberOfBettingMembersToday")}:{info.numberOfBettingMembersToday || 0}</Tag>
                    {/* <Tag style={{backgroundColor: 'white', border: '1px solid transparent'}} className="!me-0.5" >{t("numberOfBetsToday")}:{info.numberOfBetsToday || 0}</Tag> */}
                  </Space.Compact>
                </>
              ) : null}
              <Content className={pathname === "/admin/auth/login" || pathname === "/partner/auth/login" ? "" : "p-2"}>
                {children}
              </Content>
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