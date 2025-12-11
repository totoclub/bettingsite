"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import { Layout, theme, Modal, Dropdown, Button } from "antd";
import type { MenuProps } from "antd";

import {
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MailOutlined,
  DollarOutlined,
  DollarCircleOutlined,
} from "@ant-design/icons";

import LangSwitcher from "./Common/LangSwitcher";
import { useLocale, useTranslations } from "next-intl";
import { currentTheme, userState } from "@/state/state";
import { useAtom } from "jotai";
import api from "@/api";
import { formatNumber } from "@/lib";
import Login from "./Auth/Login";
import SignUp from "./Auth/SignUp";
import DepositRequest from "./Billing/DepositRequst";
import WithdrawRequest from "./Billing/WithdrawRequst";
import Notice from '@/components/notice/page';
import Event from '@/components/event/page';
import ProfilePage from '@/components/profile/page';
import QnaPage from "@/components/qna/page";
import NotePage from "@/components/note/page";
import BettingHistoryPage from "@/components/betlog/page";
import Logo from "@/assets/img/logo.png";
import Image from "next/image";
import Link from "next/link";
import BannerRight from "@/assets/img/main/home-hero-img.png";
import Jackpot from "@/assets/img/main/progressive-jackpot-img.png";
import casinoActiveIcon from "@/assets/img/btn/casino-tab1.png";
import casinoGameIcon from "@/assets/img/btn/casino-tab2.png";
import slotActiveIcon from "@/assets/img/btn/slot-tab1.png";
import slotGameIcon from "@/assets/img/btn/slot-tab2.png";
import miniActiveIcon from "@/assets/img/btn/mini-tab1.png";
import miniGameIcon from "@/assets/img/btn/mini-tab2.png";
import Level1 from "@/assets/img/level/lv1.png"
import Level2 from "@/assets/img/level/lv2.png"
import Level3 from "@/assets/img/level/lv3.png"
import Level4 from "@/assets/img/level/lv4.png"
import Level5 from "@/assets/img/level/lv5.png"
import Level6 from "@/assets/img/level/lv6.png"
import Level7 from "@/assets/img/level/lv7.png"
import Level8 from "@/assets/img/level/lv8.png"
import Level9 from "@/assets/img/level/lv9.png"
import Level10 from "@/assets/img/level/lv10.png"
import LevelVIP1 from "@/assets/img/level/Vip1.png"
import LevelVIP2 from "@/assets/img/level/Vip2.png"
import Prumium from "@/assets/img/level/premium.png"
import PointPage from "@/components/profile/point/page";
import RollingPage from "@/components/profile/rolling/page";

const { Header } = Layout;

const Head = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();
  const [profile, setProfile] = useAtom<any>(userState);
  const [unreadNotesCount, setUnreadNotesCount] = useState(0);
  const [casinoBalance, setCasinoBalance] = useState<number>(0);
  const t = useTranslations();
  const locale = useLocale();
  
  // Real-time jackpot counter state
  const [jackpotAmount, setJackpotAmount] = useState((new Date()).getTime()/1200);
  const [selectedkeys, setSelectedkeys] = useState<string[]>(["home"]);

  const [activeTab, setActiveTab] = useState<string>("casino");
  
  // Login modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Signup modal state
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  
  // Deposit modal state
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Withdraw modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Notice modal state
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  // Event modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Note modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // Qna modal state
  const [isQnaModalOpen, setIsQnaModalOpen] = useState(false);

  // BettingHistory modal state
  const [isBettingHisotryModalOpen, setIsBettingHistoryModalOpen] = useState(false);

  // point modal state
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);

  // rolling modal state
  const [isRollingModalOpen, setIsRollingModalOpen] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    const newState = !isMenuOpen
    setIsMenuOpen(newState);
  }

  const checkoutModal = (modal: string) => {
    if (modal === "withdraw") {
      setIsDepositModalOpen(false);
      setIsNoticeModalOpen(false);
      setIsEventModalOpen(false);
      setIsQnaModalOpen(false);
      setIsNoteModalOpen(false);
      setIsProfileModalOpen(false);
      setIsBettingHistoryModalOpen(false);
      setIsPointModalOpen(false);
      setIsRollingModalOpen(false);
      handleWithdrawClick();
    } else if (modal === "deposit") {
      setIsWithdrawModalOpen(false);
      setIsNoticeModalOpen(false);
      setIsEventModalOpen(false);
      setIsQnaModalOpen(false);
      setIsNoteModalOpen(false);
      setIsProfileModalOpen(false);
      setIsBettingHistoryModalOpen(false);
      setIsPointModalOpen(false);
      setIsRollingModalOpen(false);
      handleDepositClick();
    } else if (modal === "notice") {
      setIsWithdrawModalOpen(false);
      setIsDepositModalOpen(false);
      setIsEventModalOpen(false);
      setIsQnaModalOpen(false);
      setIsNoteModalOpen(false);
      setIsProfileModalOpen(false);
      setIsBettingHistoryModalOpen(false);
      setIsRollingModalOpen(false);
      setIsPointModalOpen(false);
      handleNoticeClick();
    } else if (modal === "event") {
      setIsWithdrawModalOpen(false);
      setIsDepositModalOpen(false);
      setIsNoticeModalOpen(false);
      setIsQnaModalOpen(false);
      setIsNoteModalOpen(false);
      setIsProfileModalOpen(false);
      setIsBettingHistoryModalOpen(false);
      setIsRollingModalOpen(false);
      setIsPointModalOpen(false);
      handleEventClick();
    } else if (modal === "profile") {
      setIsWithdrawModalOpen(false);
      setIsDepositModalOpen(false);
      setIsNoticeModalOpen(false);
      setIsEventModalOpen(false);
      setIsQnaModalOpen(false);
      setIsNoteModalOpen(false);
      setIsQnaModalOpen(false);
      setIsBettingHistoryModalOpen(false);
      setIsRollingModalOpen(false);
      setIsPointModalOpen(false);
      handleProfileClick();
    } else if (modal === "letter") {
      setIsWithdrawModalOpen(false);
      setIsDepositModalOpen(false);
      setIsNoticeModalOpen(false);
      setIsEventModalOpen(false);
      setIsQnaModalOpen(false);
      setIsProfileModalOpen(false);
      setIsBettingHistoryModalOpen(false);
      setIsRollingModalOpen(false);
      setIsPointModalOpen(false);
      handleNoteClick();
    } else if (modal === "qna") {
      setIsWithdrawModalOpen(false);
      setIsDepositModalOpen(false);
      setIsNoticeModalOpen(false);
      setIsEventModalOpen(false);
      setIsNoteModalOpen(false);
      setIsProfileModalOpen(false);
      setIsNoteModalOpen(false);
      setIsBettingHistoryModalOpen(false);
      setIsRollingModalOpen(false);
      setIsPointModalOpen(false);
      handleQnaClick();
    } else if (modal === "bettingHistory") {
      setIsWithdrawModalOpen(false);
      setIsDepositModalOpen(false);
      setIsNoticeModalOpen(false);
      setIsEventModalOpen(false);
      setIsQnaModalOpen(false);
      setIsNoteModalOpen(false);
      setIsProfileModalOpen(false);
      setIsPointModalOpen(false); 
      setIsRollingModalOpen(false);
      handleBettingHistoryClick();
    } else if (modal === "point") {
      setIsWithdrawModalOpen(false);
      setIsDepositModalOpen(false);
      setIsNoticeModalOpen(false);
      setIsEventModalOpen(false);
      setIsQnaModalOpen(false);
      setIsNoteModalOpen(false);
      setIsProfileModalOpen(false);
      setIsBettingHistoryModalOpen(false);
      setIsRollingModalOpen(false);
      handlePointClick();
    } else if (modal == "rolling") {
      setIsWithdrawModalOpen(false);
      setIsDepositModalOpen(false);
      setIsNoticeModalOpen(false);
      setIsEventModalOpen(false);
      setIsQnaModalOpen(false);
      setIsNoteModalOpen(false);
      setIsProfileModalOpen(false);
      setIsBettingHistoryModalOpen(false);
      setIsPointModalOpen(false);
      handleRollingClick();
    }
  };

  // Real-time jackpot updater
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpotAmount(prev => prev + (Math.floor(Math.random() * 15) + 5) * 2);
    }, 50); // Update every 50ms for smooth real-time effect

    return () => clearInterval(interval);
  }, []); 

  useEffect(() => {
    const path = pathname.split("/")[1];
    console.log(path, 'path');
    if (path === "") {
      setActiveTab("casino");
    } else if (path === "slot") {
      setActiveTab("slot");
    } else if (path === "mini") {
      setActiveTab("mini");
    }
  }, [pathname]);

  useEffect(() => {
    const fetchProfileData = () => {
      api("user/me").then((res) => {
        setProfile(res.data.profile);
        fetchData(res.data.profile);
      }).catch((err) => {
        console.log(err);
      });
    };
    // Initial fetch
    fetchProfileData();

    // Set up interval to fetch every 5 seconds
    const interval = setInterval(fetchProfileData, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [])

  // Fetch casino balance every second when user is logged in
  useEffect(() => {
    if (!profile?.id && !profile?.userId) {
      setCasinoBalance(0);
      return;
    }

    const fetchCasinoBalance = () => {
      api("user/me").then((res) => {
        const userId = res.data.userid;
        if (userId) {
          api("casino/get-balance", {
            method: "GET",
            params: {
              username: userId
            }
          }).then((response) => {
            const balance = typeof response.balance === 'number' 
              ? response.balance 
              : parseFloat(response.balance) || 0;
            setCasinoBalance(balance);
          }).catch((err) => {
            console.log("Error fetching casino balance:", err);
            setCasinoBalance(0);
          });
        }
      }).catch((err) => {
        console.log("Error fetching user:", err);
      });
    };

    // Initial fetch
    fetchCasinoBalance();

    // Set up interval to fetch every second
    const interval = setInterval(fetchCasinoBalance, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [profile?.id, profile?.userId])

  const fetchData = async (profile: any) => {
    const response = await api("notes/get-unread-notes-count", {
      method: "POST",
      data: {
        user_id: profile.userId,
      }
    });
    setUnreadNotesCount(response?.count);
  }

  // Format number with commas and milliseconds simulation
  const formatJackpot = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };
  const [isDarkTheme, setDarkTheme] = useAtom<boolean>(currentTheme);

  const onMenuClick = (e: MenuInfo) => {
    setSelectedkeys(e.keyPath);
    console.log(e.key, 'e.key');
    if (pathname === e.key) {
      router.refresh();
    } else {
      router.push(e.key as string);
    }
  };

  const onLogout = async () => {
    setProfile({}); 
    api("auth/logout", { method: "POST" }).then((res) => {
      console.log({res})
      localStorage.removeItem("token");
      window.location.reload();
    });
  };

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleSignupClick = () => {
    setIsSignupModalOpen(true);
  };

  const handleCloseSignupModal = () => {
    setIsSignupModalOpen(false);
  };

  const handleDepositClick = () => {
    setIsMenuOpen(false);
    if (profile?.id) {
      setIsDepositModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleCloseDepositModal = () => {
    setIsDepositModalOpen(false);
  };

  const handleWithdrawClick = () => {
    setIsMenuOpen(false);
    if (profile?.id) {
      setIsWithdrawModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleCloseWithdrawModal = () => {
    setIsWithdrawModalOpen(false);
  };

  const handleNoticeClick = () => {
    setIsMenuOpen(false);
    if (profile?.id) {
      setIsNoticeModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleCloseNoticeModal = () => {
    setIsNoticeModalOpen(false);
  };

  const handleEventClick = () => {
    setIsMenuOpen(false);
    if (profile?.id) {
      setIsEventModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleCloseEventModal = () => {
    setIsEventModalOpen(false);
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const handleNoteClick = () => {
    setIsNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setIsNoteModalOpen(false);
  };

  const handleQnaClick = () => {
    setIsQnaModalOpen(true);
  };

  const handleCloseQnaModal = () => {
    setIsQnaModalOpen(false);
  };

  const handleBettingHistoryClick = () => {
    setIsBettingHistoryModalOpen(true);
  };

  const handleCloseBettingHistoryModal = () => {
    setIsBettingHistoryModalOpen(false);
  };

  const handlePointClick = () => {
    setIsMenuOpen(false);
    if (profile?.id) {
      setIsPointModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleClosePointModal = () => {
    setIsPointModalOpen(false);
  };

  const handleRollingClick = () => {
    setIsMenuOpen(false);
    if (profile?.id) {
      setIsRollingModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  }

  const handleCloseRollingModal = () => {
    setIsRollingModalOpen(false);
  }

  const profileItems: MenuProps["items"] = [
    {
      key: "balance",
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="#f4d171" width={20} height={20} viewBox="0 0 640 640"><path d="M392 176L248 176L210.7 101.5C208.9 97.9 208 93.9 208 89.9C208 75.6 219.6 64 233.9 64L406.1 64C420.4 64 432 75.6 432 89.9C432 93.9 431.1 97.9 429.3 101.5L392 176zM233.6 224L406.4 224L455.1 264.6C521.6 320 560 402 560 488.5C560 536.8 520.8 576 472.5 576L167.4 576C119.2 576 80 536.8 80 488.5C80 402 118.4 320 184.9 264.6L233.6 224zM324 288C313 288 304 297 304 308L304 312C275.2 312.3 252 335.7 252 364.5C252 390.2 270.5 412.1 295.9 416.3L337.6 423.3C343.6 424.3 348 429.5 348 435.6C348 442.5 342.4 448.1 335.5 448.1L280 448C269 448 260 457 260 468C260 479 269 488 280 488L304 488L304 492C304 503 313 512 324 512C335 512 344 503 344 492L344 487.3C369 483.2 388 461.6 388 435.5C388 409.8 369.5 387.9 344.1 383.7L302.4 376.7C296.4 375.7 292 370.5 292 364.4C292 357.5 297.6 351.9 304.5 351.9L352 351.9C363 351.9 372 342.9 372 331.9C372 320.9 363 311.9 352 311.9L344 311.9L344 307.9C344 296.9 335 287.9 324 287.9z"/></svg>,
      label: formatNumber((profile?.balance || 0) + casinoBalance),
      className: "flex items-center justify-between w-full",
      onClick: (e: MenuInfo) => {
        console.log({ e });
        handleProfileClick();
      },
    },
    {
      key: "point",
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="#f4d171" width={20} height={20}><path d="M192 160L192 144C192 99.8 278 64 384 64C490 64 576 99.8 576 144L576 160C576 190.6 534.7 217.2 474 230.7C471.6 227.9 469.1 225.2 466.6 222.7C451.1 207.4 431.1 195.8 410.2 187.2C368.3 169.7 313.7 160.1 256 160.1C234.1 160.1 212.7 161.5 192.2 164.2C192 162.9 192 161.5 192 160.1zM496 417L496 370.8C511.1 366.9 525.3 362.3 538.2 356.9C551.4 351.4 564.3 344.7 576 336.6L576 352C576 378.8 544.5 402.5 496 417zM496 321L496 288C496 283.5 495.6 279.2 495 275C510.5 271.1 525 266.4 538.2 260.8C551.4 255.2 564.3 248.6 576 240.5L576 255.9C576 282.7 544.5 306.4 496 320.9zM64 304L64 288C64 243.8 150 208 256 208C362 208 448 243.8 448 288L448 304C448 348.2 362 384 256 384C150 384 64 348.2 64 304zM448 400C448 444.2 362 480 256 480C150 480 64 444.2 64 400L64 384.6C75.6 392.7 88.5 399.3 101.8 404.9C143.7 422.4 198.3 432 256 432C313.7 432 368.3 422.3 410.2 404.9C423.4 399.4 436.3 392.7 448 384.6L448 400zM448 480.6L448 496C448 540.2 362 576 256 576C150 576 64 540.2 64 496L64 480.6C75.6 488.7 88.5 495.3 101.8 500.9C143.7 518.4 198.3 528 256 528C313.7 528 368.3 518.3 410.2 500.9C423.4 495.4 436.3 488.7 448 480.6z"/></svg>,
      label: formatNumber(profile?.point),
      onClick: (e: MenuInfo) => {
        console.log({ e });
        handlePointClick();
      },
    },
    {
      key: "qna",
      icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="#f4d171" width={20} height={20}><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM320 240C302.3 240 288 254.3 288 272C288 285.3 277.3 296 264 296C250.7 296 240 285.3 240 272C240 227.8 275.8 192 320 192C364.2 192 400 227.8 400 272C400 319.2 364 339.2 344 346.5L344 350.3C344 363.6 333.3 374.3 320 374.3C306.7 374.3 296 363.6 296 350.3L296 342.2C296 321.7 310.8 307 326.1 302C332.5 299.9 339.3 296.5 344.3 291.7C348.6 287.5 352 281.7 352 272.1C352 254.4 337.7 240.1 320 240.1zM288 432C288 414.3 302.3 400 320 400C337.7 400 352 414.3 352 432C352 449.7 337.7 464 320 464C302.3 464 288 449.7 288 432z"/></svg>,
      label: t('QNA'),
      onClick: (e: MenuInfo) => {
        console.log({ e });
        handleQnaClick();
      },
    },
    {
      key: "level",
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="#f4d171" width={20} height={20} viewBox="0 0 640 640"><path d="M341.5 45.1C337.4 37.1 329.1 32 320.1 32C311.1 32 302.8 37.1 298.7 45.1L225.1 189.3L65.2 214.7C56.3 216.1 48.9 222.4 46.1 231C43.3 239.6 45.6 249 51.9 255.4L166.3 369.9L141.1 529.8C139.7 538.7 143.4 547.7 150.7 553C158 558.3 167.6 559.1 175.7 555L320.1 481.6L464.4 555C472.4 559.1 482.1 558.3 489.4 553C496.7 547.7 500.4 538.8 499 529.8L473.7 369.9L588.1 255.4C594.5 249 596.7 239.6 593.9 231C591.1 222.4 583.8 216.1 574.8 214.7L415 189.3L341.5 45.1z"/></svg>,
      label: (() => {
        const level = profile?.level || 1;
        switch(level) {
          case 0:
          case 1: return <Image src={Level1} width={70} alt="level1"/>;
          case 2: return <Image src={Level2} width={70} alt="level2"/>;
          case 3: return <Image src={Level3} width={70} alt="level3"/>;
          case 4: return <Image src={Level4} width={70} alt="level4"/>;
          case 5: return <Image src={Level5} width={70} alt="level5"/>;
          case 6: return <Image src={Level6} width={70} alt="level6"/>;
          case 7: return <Image src={Level7} width={70} alt="level7"/>;
          case 8: return <Image src={Level8} width={70} alt="level8"/>;
          case 9: return <Image src={Level9} width={70} alt="level9"/>;
          case 10: return <Image src={Level10} width={70} alt="level10"/>;
          case 11: return <Image src={LevelVIP1} width={70} alt="LevelVIP1"/>;
          case 12: return <Image src={LevelVIP2} width={70} alt="LevelVIP2"/>;
          case 13: return <Image src={Prumium} width={70} alt="Prumium"/>;
          default: return <Image src={Level1} width={70} alt="level1"/>;
        }
      })(),
      onClick: (e: MenuInfo) => {
        console.log({ e });
        handleProfileClick();
      },
    },
    {
      key: "bettingHistory",
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="#f4d171" width={20} height={20} viewBox="0 0 640 640"><path d="M224 144L224 112C224 85.5 245.5 64 272 64L368 64C394.5 64 416 85.5 416 112L416 144L608 144C625.7 144 640 158.3 640 176C640 193.7 625.7 208 608 208L32 208C14.3 208 0 193.7 0 176C0 158.3 14.3 144 32 144L224 144zM64 256L64 496C64 531.3 92.7 560 128 560L512 560C547.3 560 576 531.3 576 496L576 256L64 256zM192 352L192 416C192 433.7 206.3 448 224 448L256 448C273.7 448 288 433.7 288 416L288 352C288 334.3 273.7 320 256 320L224 320C206.3 320 192 334.3 192 352zM352 352L352 416C352 433.7 366.3 448 384 448L416 448C433.7 448 448 433.7 448 416L448 352C448 334.3 433.7 320 416 320L384 320C366.3 320 352 334.3 352 352z"/></svg>,
      label: t('bettingHistory'),
      onClick: (e: MenuInfo) => {
        handleBettingHistoryClick();
        console.log({ e });
      },
    },
    {
      key: "logout",
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="#f4d171" width={20} height={20}  viewBox="0 0 640 640"><path d="M569 337C578.4 327.6 578.4 312.4 569 303.1L425 159C418.1 152.1 407.8 150.1 398.8 153.8C389.8 157.5 384 166.3 384 176L384 256L272 256C245.5 256 224 277.5 224 304L224 336C224 362.5 245.5 384 272 384L384 384L384 464C384 473.7 389.8 482.5 398.8 486.2C407.8 489.9 418.1 487.9 425 481L569 337zM224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L160 96C107 96 64 139 64 192L64 448C64 501 107 544 160 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480C142.3 480 128 465.7 128 448L128 192C128 174.3 142.3 160 160 160L224 160z"/></svg>,
      label: t('logout'),
      onClick: onLogout,
    },
    {
       key: "goToPartner",
       icon: <svg xmlns="http://www.w3.org/2000/svg" fill="#f4d171" width={20} height={20} viewBox="0 0 640 640"><path d="M569 337C578.4 327.6 578.4 312.4 569 303.1L425 159C418.1 152.1 407.8 150.1 398.8 153.8C389.8 157.5 384 166.3 384 176L384 256L112 256C85.5 256 64 277.5 64 304L64 336C64 362.5 85.5 384 112 384L384 384L384 464C384 473.7 389.8 482.5 398.8 486.2C407.8 489.9 418.1 487.9 425 481L569 337z"/></svg>,
       label: t('goToPartner'),
       onClick: (e: MenuInfo) => {
         console.log({ e });
         router.push("/partner");
       },
     },
  ];

  return (
    <div className="header-container">
      <header className="py-4 navbar mx-auto flex justify-between 2xl:px-0 px-4 items-center max-w-[1300px] mx-auto mx-[15px]">
        <div className="max-w-[120px]">
          <Link href='/'>
            <Image src={Logo} alt="logo" height={100} className="cursor-pointer"/>
          </Link>
        </div>
        <div className="w-full nav-item-menu mr-[35px] md:flex hidden">
          <ul className="flex gap-[25px] w-full justify-end">
            <li>  
              <button 
                onClick={handleDepositClick}
                className="font-bold text-white hover:text-[#fce18f] transition-all duration-300 bg-transparent border-none cursor-pointer"
              >
                <span>
                  {t(`deposit`)}
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={handleWithdrawClick}
                className="font-bold text-white hover:text-[#fce18f] transition-all duration-300 bg-transparent border-none cursor-pointer hover:scale-105">
                <span>
                  {t(`withdraw`)}
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={handlePointClick}
                className="font-bold text-white hover:text-[#fce18f] transition-all duration-300 bg-transparent border-none cursor-pointer hover:scale-105">
                <span>
                  {t(`point`)}
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={handleRollingClick}
                className="font-bold text-white hover:text-[#fce18f] transition-all duration-300 bg-transparent border-none cursor-pointer hover:scale-105">
                <span>
                  {t(`rolling`)}
                </span>
              </button>
            </li>
            <li>
              <button 
                onClick={handleNoticeClick}
                className="font-bold text-white hover:text-[#fce18f] transition-all duration-300 bg-transparent border-none cursor-pointer hover:scale-105">
                <span>
                  {t(`notice`)}
                </span>
              </button>
            </li>
            <li>
              <button 
                onClick={handleEventClick}
                className="font-bold text-white hover:text-[#fce18f] transition-all duration-300 bg-transparent border-none cursor-pointer hover:scale-105">
                  <span>
                  {t(`event`)}
                </span>
              </button>
            </li>
          </ul>
        </div>

        {/**mobile nabvar */}
        <div 
          className={`z-9999 mobile-navbar-overlay fixed top-0 right-[0] w-full h-full bg-black bg-opacity-50 md:hidden transition-all duration-300 ${
            isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              toggleMenu();
            }
          }}
        >
          <div className={`mobile-navbar-panel absolute top-0 left-0 w-full h-full bg-[#23160b] shadow-2xl transform transition-all duration-300 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="p-6">
              <div className="flex justify-center items-center mb-8 relative">
                <Image src={Logo} alt="logo" height={60} className="cursor-pointer"/>
                <button
                  onClick={toggleMenu}
                  className="absolute right-0 text-white hover:text-[#fce18f] cursor-pointer transition-colors duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              <ul className="space-y-4">
                <li>
                  <button
                    onClick={handleDepositClick}
                    className="w-full text-center cursor-pointer py-3 px-4 text-white hover:text-[#fce18f] boder-1 border-[transparent] hover:border-[#fce18f] hover:border-1 hover:bg-[#2a2a2a] rounded-lg transition-all duration-300 font-bold"
                  >
                    {t(`deposit`)}
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleWithdrawClick}
                    className="w-full text-center cursor-pointer py-3 px-4 text-white hover:text-[#fce18f] boder-1 border-[transparent] hover:border-[#fce18f] hover:border-1 hover:bg-[#2a2a2a] rounded-lg transition-all duration-300 font-bold"
                  >
                    {t(`withdraw`)}
                  </button>
                </li>
                <li>
                  <button
                    onClick={handlePointClick}
                    className="w-full text-center cursor-pointer py-3 px-4 text-white hover:text-[#fce18f] boder-1 border-[transparent] hover:border-[#fce18f] hover:border-1 hover:bg-[#2a2a2a] rounded-lg transition-all duration-300 font-bold"
                  >
                    {t(`point`)}
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleRollingClick}
                    className="w-full text-center cursor-pointer py-3 px-4 text-white hover:text-[#fce18f] boder-1 border-[transparent] hover:border-[#fce18f] hover:border-1 hover:bg-[#2a2a2a] rounded-lg transition-all duration-300 font-bold"
                  >
                    {t(`rolling`)}
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleNoticeClick}
                    className="w-full text-center cursor-pointer py-3 px-4 text-white hover:text-[#fce18f] boder-1 border-[transparent] hover:border-[#fce18f] hover:border-1 hover:bg-[#2a2a2a] rounded-lg transition-all duration-300 font-bold"
                  >
                    {t(`notice`)}
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleEventClick}
                    className="w-full text-center cursor-pointer py-3 px-4 text-white hover:text-[#fce18f] boder-1 border-[transparent] hover:border-[#fce18f] hover:border-1 hover:bg-[#2a2a2a] rounded-lg transition-all duration-300 font-bold"
                  >
                    {t(`event`)}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <button
          className="left-menu md:hidden cursor-pointer text-white focus:outline-none transition-all duration-300 hover:scale-110 fixed top-27 left-0 z-[5000] bg-[#21150b] border-[#fce18f] border-t-1 border-r-1 border-b-1 hover:bg-[#2a2a2a] p-3 shadow-lg"
          onClick={(e) => {

            e.preventDefault();
            toggleMenu();
          }}
        >
          {/* Hamburger icon (three lines) */}
          <svg xmlns="http://www.w3.org/2000/svg" className={`transition-all duration-500 h-6 w-6 ${isMenuOpen ? 'rotate-90' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        <div className="flex items-center">
          <div className="mr-[10px] md:mr-[35px] language-switcher">
            <LangSwitcher locale={locale} />
          </div>
          {
            !profile?.id ? (
              <div className="flex gap-2 md:gap-4">
                <button className="header-button btn-login max-h-[40px] py-1 px-3 rounded" onClick={handleLoginClick}>
                  <span>
                    {t(`login`)}
                  </span>
                </button>
                <button className="header-button btn-joinnow max-h-[40px] py-1 px-3 rounded" onClick={handleSignupClick}>
                  <span>
                    {t(`joinUs`)}
                  </span>
                </button>
              </div>
            ) : (
              <Dropdown 
                menu={{ items: profileItems }} 
                trigger={['click']} 
                placement="bottomRight"
                overlayStyle={{ backgroundColor: '#2b2314' }}
                overlayClassName="profile-dropdown"
              >
                <button className="header-button btn-profile max-h-[40px] flex items-center gap-2">
                  <UserOutlined className="text-[#f6d47c] font-bold"/>
                  <span className="text-[#f6d47c] font-bold text-[17px]">
                    {profile?.name || t(`profile`)}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 640 640" width={10} height={10}><path d="M480 224C492.9 224 504.6 231.8 509.6 243.8C514.6 255.8 511.8 269.5 502.7 278.7L342.7 438.7C330.2 451.2 309.9 451.2 297.4 438.7L137.4 278.7C128.2 269.5 125.5 255.8 130.5 243.8C135.5 231.8 147.1 224 160 224L480 224z"/></svg>
                </button>
              </Dropdown>
            )
          }
          {profile?.id >= 0 && (
            <div className="notification-container ml-4">
              <button  onClick={() => handleNoteClick()} className="relative inline-block">
              <div className="bg-[#fce18f] rounded-[8px] h-[30px] w-[30px] flex items-center justify-center">
                <div className="relative m-auto">
                    <MailOutlined 
                      className="text-[#f6d47c] notificationIconClass text-[black] mt-1 flex justify-center items-center m-auto text-xl hover:text-[#fce18f] transition-colors duration-300 cursor-pointer" 
                    />
                      {unreadNotesCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-[#2b2314]">
                          {unreadNotesCount > 99 ? '99+' : unreadNotesCount}
                        </span>
                      )}
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ">
                        {unreadNotesCount > 99 ? '99+' : unreadNotesCount}
                      </span>
                    </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="banner flex md:min-h-[450px] min-h-[400px] border-b-[2px] md:px-10 px-4 border-[#fce18f]">
        <div className="max-w-[1300px] mx-auto pb-[60px] mx-[15px] flex justify-between items-center">
          <div className="banner-left w-[50%] md:flex hidden">
            <h2>{t(`playOnlineCasinoWinMoneyUnlimited`)}</h2>
          </div>
          <div className="banner-right md:w-[50%] w-full flex justify-center">
            <Image src={BannerRight} alt="banner-right"/>
          </div>
        </div>
      </div>
      <div className="jackpot-section mt-[-60px] xl:max-w-[1350px] max-w-[90%] px-4 mx-auto flex items-center justify-between rounded-[20px] border-[2px] border-[#fce18f]">
        <div className="flex items-center relative gap-6 md:py-0 py-3 w-full xl:flex-row flex-row-reverse">
          <div className="jackpot-image xl:flex hidden">
            <Image src={Jackpot} alt="jackpot" className="xl:w-[230px] w-[180px] flex absolute bottom-0 left-0" />
          </div>
          <div className="jackpot-content text-center w-full justify-between xl:ml-[250px] ml-0 xl:ml-[180px] xl:flex-row flex-row-reverse xl:flex">
            <div className="jackpot-label my-auto xl:block flex xl:gap-0 gap-2 xl:justify-start justify-center">
              <h5 className="xl:text-[40px] md:text-[30px] text-[25px] my-0 font-semibold text-white uppercase">{t(`progressive`)}</h5>
              <h5 className="text-[#fce18f] my-0 xl:text-[40px] md:text-[30px] text-[25px] font-semibold uppercase">{t(`jackpot`)}</h5>
            </div>
            <div className="jackpot-amount">
              <span className="xl:text-[80px] md:text-[60px] text-[45px] font-bold text-white tracking-wider">
                {formatJackpot(jackpotAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <div className="flex gap-4 relative cursor-pointer" onClick={() => {
          setActiveTab("casino");
          router.push("/");
        }}>
          {
            activeTab !== "casino" ? (
              <>
                <Image src={casinoActiveIcon} alt="casinoActiveIcon" className="md:w-[120px] w-[80px] md:h-[140px] h-[95px]"/>
              </>
            ) : (
              <>
                <Image src={casinoGameIcon} alt ="casinoGameIcon" className="md:w-[120px] w-[80px] md:h-[140px] h-[95px]"/>
              </>
          )}
          <h2 className="absolute md:top-6 top-4 md:w-[120px] w-[80px] text-center text-[#fce18f] md:text-[30px] text-[20px]">{t("casino")}</h2>
        </div>
        <div className="flex gap-4 relative cursor-pointer" onClick={() => {
          setActiveTab("slot");
          router.push("/slot");
        }}>
          {
            activeTab !== "slot" ? (
              <>
                <Image src={slotActiveIcon} alt="slotActiveIcon" className="md:w-[120px] w-[80px] md:h-[140px] h-[95px]" />
              </>
            ) : (
              <>
                <Image src={slotGameIcon} alt="slotGameIcon" className="md:w-[120px] w-[80px] md:h-[140px] h-[95px]"/>
              </>
            )
          }
          <h2 className="absolute md:top-6 top-4 md:w-[120px] w-[80px] text-center text-[#fce18f] md:text-[30px] text-[20px]">{t("slot")}</h2>
        </div>
        <div className="flex gap-4 relative cursor-pointer" onClick={() => {
          setActiveTab("mini");
          router.push("/mini");
        }}>
          {
            activeTab !== "mini" ? (
              <>
                <Image src={miniActiveIcon} alt="miniActiveIcon" className="md:w-[120px] w-[80px] md:h-[140px] h-[95px]"/>
              </>
            ) : (
              <>
                <Image src={miniGameIcon} alt="miniGameIcon" className="md:w-[120px] w-[80px] md:h-[140px] h-[95px]"/>
              </>
            )
          }
          <h2 className="absolute md:top-6 top-4 md:w-[120px] w-[80px] text-center text-[#fce18f] md:text-[30px] text-[20px]">{t("mini")}</h2>
        </div>
      </div> 
      {/* <Sidebar isDarkTheme={isDarkTheme} menu={menu} /> */}
      
      {/* Login Modal */}
      <Modal
        title={null}
        open={isLoginModalOpen}
        onCancel={handleCloseModal}
        className="p-0 modal-content modal-fade-in"
        footer={null}
        width={600}
        centered
        transitionName=""
        maskTransitionName=""
      >
        <Login onClose={handleCloseModal} />
      </Modal>

      {/* Signup Modal */}
      <Modal
        title={null}
        open={isSignupModalOpen}
        onCancel={handleCloseSignupModal}
        footer={null}
        className="p-0 modal-content modal-fade-in"
        width={600}
        centered
        transitionName=""
        maskTransitionName=""
      >
        <SignUp onClose={handleCloseSignupModal} />
      </Modal>

      {/* Deposit Modal */}
      <Modal
        title={null}
        open={isDepositModalOpen}
        onCancel={handleCloseDepositModal}
        footer={null}
        className="p-0 modal-content modal-fade-in"
        width={800}
        centered
        transitionName=""
        maskTransitionName=""
      >
        <DepositRequest checkoutModal={checkoutModal} />
      </Modal>
      <Modal
        title={null}
        open={isWithdrawModalOpen}
        onCancel={handleCloseWithdrawModal}
        footer={null}
        className="p-0 modal-content modal-fade-in"
        width={800}
        centered
        transitionName=""
        maskTransitionName=""
      >
        <WithdrawRequest checkoutModal={checkoutModal} />
      </Modal>
      <Modal
        title={null}
        open={isNoticeModalOpen}
        onCancel={handleCloseNoticeModal}
        footer={null}
        className="p-0 modal-content modal-fade-in"
        width={800}
        centered
        transitionName=""
        maskTransitionName=""
      >
        <Notice checkoutModal={checkoutModal} />
      </Modal>
      <Modal
        title={null}
        open={isEventModalOpen}
        onCancel={handleCloseEventModal}
        footer={null}
        className="p-0 modal-content modal-fade-in"
        width={800}
        centered
        transitionName=""
        maskTransitionName=""
      >
        <Event checkoutModal={checkoutModal} />
      </Modal>
      <Modal
        title={null}
        open={isProfileModalOpen}
        onCancel={handleCloseProfileModal}
        footer={null}
        className="p-0 modal-content modal-fade-in"
        width={800}
        centered
        transitionName=""
        maskTransitionName=""
      >
        <ProfilePage checkoutModal={checkoutModal} />
      </Modal>

      <Modal
        title={null}
        open={isNoteModalOpen}
        onCancel={handleCloseNoteModal}
        footer={null}
        className="p-0 modal-content modal-fade-in"
        width={800}
        centered
        transitionName=""
        maskTransitionName=""
      >
        <NotePage checkoutModal={checkoutModal} />
      </Modal>

      <Modal
        title={null}
        open={isQnaModalOpen}
        onCancel={handleCloseQnaModal}
        footer={null}
        className="p-0 modal-content modal-fade-in"
        width={800}
        centered
        transitionName=""
        maskTransitionName=""
      >
        <QnaPage checkoutModal={checkoutModal} />
      </Modal>
      <Modal
        title={null}
        open={isBettingHisotryModalOpen}
        onCancel={handleCloseBettingHistoryModal}
        footer={null}
        className="p-0 modal-content modal-fade-in"
        width={800}
        centered
        transitionName=""
        maskTransitionName=""
      >
        <BettingHistoryPage checkoutModal={checkoutModal} />
      </Modal>
      <Modal
        title={null}
        open={isPointModalOpen}
        onCancel={handleClosePointModal}
        footer={null}
        className="p-0 modal-content modal-fade-in"
        width={800}
        centered
        transitionName=""
        maskTransitionName=""
      >
        <PointPage checkoutModal={checkoutModal} />
      </Modal>
      <Modal
        title={null}
        open={isRollingModalOpen}
        onCancel={handleCloseRollingModal}
        footer={null}
        className="p-0 modal-content modal-fade-in"
        width={800}
        centered
        transitionName=""
        maskTransitionName=""
      >
        <RollingPage checkoutModal={checkoutModal} />
      </Modal>
    </div>
  );
};

export default Head;