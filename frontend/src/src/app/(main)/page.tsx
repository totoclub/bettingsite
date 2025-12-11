"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Spin, message, Layout, Modal } from "antd";
import { useRouter } from "next/navigation";
import Login from "@/components/Auth/Login";
import api from "@/api";
import { usePageTitle } from "@/hooks/usePageTitle";

// Import casino game company logos
import evolutionLogo from "@/assets/img/casinoGame/evolution.png";
import vivoLogo from "@/assets/img/casinoGame/vivo.png";
import ezugiLogo from "@/assets/img/casinoGame/ezugi.png";
import Live88Logo from "@/assets/img/casinoGame/live88.png";
import virtualLogo from "@/assets/img/casinoGame/vir2al.png";
import jiliLogo from "@/assets/img/casinoGame/jili.png";
import MicroGamingLogo from "@/assets/img/casinoGame/microgaming.png";
import orientalLogo from "@/assets/img/casinoGame/oriental.png";
import PGSoftLogo from "@/assets/img/casinoGame/pgsoft.png";
import PragmaticPlay from "@/assets/img/casinoGame/pragmatic.png";
import SuperSpade from "@/assets/img/casinoGame/superspade.png";
import wmLiveLogo from "@/assets/img/casinoGame/wm.png";
import XProGamingLogo from "@/assets/img/casinoGame/xprogaming.png";
import absoluteLogo from "@/assets/img/casinoGame/alg.png";
import inraceLogo from "@/assets/img/casinoGame/inrace.png";
import globalbetLogo from "@/assets/img/casinoGame/globalbet.png";
import fachai from "@/assets/img/casinoGame/fachai.png";
import DreamGameLogo from "@/assets/img/casinoGame/dreamgaming.png";
import DowinLogo from "@/assets/img/casinoGame/dowin.png";
import btiLogo from "@/assets/img/casinoGame/bti.png";
import botaLogo from "@/assets/img/casinoGame/bota.png";
import bitvilleLogo from "@/assets/img/casinoGame/bitville.png";
import AsiaGamingLogo from "@/assets/img/casinoGame/ag.png";

const Index: React.FC = () => {
  usePageTitle("TOTOCLUB - Home Page");
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<any>("");
  const [selectedGame, setSelectedGame] = useState<any>("");
  const [balance, setBalance] = useState<any>(0);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const popupCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const popupGameName = useRef<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Check if user is logged in and get profile
  useEffect(() => {
    api("user/me").then((res) => {
      setProfile(res.data.profile);
    }).catch((err) => {
      console.log(err);
    });
  }, []);

  // Get user ID and balance
  useEffect(() => {
    api("user/me").then((res) => {
      setUserId(res.data.userid);
      api("casino/get-balance", {
        method: "GET",
        params: {
          username: res.data.userid
        }
      }).then((response) => {
        setBalance(response.balance);
        console.log(response.balance, 'balance');
      });
    }).catch((err) => {
      console.log(err);
    });
  }, [currentStatus]);

  // Cleanup popup check interval on component unmount
  useEffect(() => {
    return () => {
      if (popupCheckInterval.current) {
        clearInterval(popupCheckInterval.current);
      }
    };
  }, []);

  // Add window focus event listener to detect when popup closes
  useEffect(() => {
    const handleWindowFocus = () => {
      if (popupWindow && popupGameName.current) {
        // When main window gains focus, check if popup is still open
        setTimeout(() => {
          checkPopupClosed(popupGameName.current);
        }, 100);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [popupWindow]);

  const handlePopupOpen = (gameName: string) => {
    console.log(`🎮 Popup opened for game: ${gameName}`);
    message.success(`Opening ${gameName} game...`);
    handleAddBalance();
  };

  const handlePopupClose = (gameName: string) => {
    console.log(`🔒 Popup closed for game: ${gameName}`);
    message.info(`${gameName} game window closed`);
    setPopupWindow(null);
    popupGameName.current = ''; // Clear the game name
    if (popupCheckInterval.current) {
      clearInterval(popupCheckInterval.current);
      popupCheckInterval.current = null;
    }
    api("casino/withdraw", {
      method: "GET",
      params: {
        username: userId
      }
    }).then((response) => {
      console.log(response, 'response');
      setCurrentStatus(2);
    }).catch((err) => {
      message.error(err.response.data.error);
    });
  };

  const checkPopupClosed = (gameName: string) => {
    try {
      if (popupWindow) {
        // Try to access the window to check if it's closed
        // This will throw an error if the window is closed
        const isClosed = popupWindow.closed;
        console.log(`🔍 Checking popup status for ${gameName}:`, isClosed);
        
        if (isClosed) {
          handlePopupClose(gameName);
        }
      }
    } catch (error) {
      console.log(`❌ Error checking popup status for ${gameName}:`, error);
      // If we can't access the window, it's likely closed
      handlePopupClose(gameName);
    }
  };

  const handleAddBalance = async () => {
    api("casino/add-balance", {
      method: "GET",
      params: {
        username: userId
      }
    }).then((response) => {     
      console.log(response, 'response');
    }).catch((err) => {
      message.error(err.response.data.error);
    }).finally(() => {
      setCurrentStatus(1);
    });
  };

  const ProcessCasino = (name: string) => {
    // Check if user is authenticated
    if (!profile?.id) {
      setIsLoginModalOpen(true);
      return;
    }
    
    setLoading(true);
    setSelectedGame(name);
    console.log(userId, 'userid')
    
    // Clear any existing popup check interval
    if (popupCheckInterval.current) {
      clearInterval(popupCheckInterval.current);
      popupCheckInterval.current = null;
    }
    
    api("casino/get-game-link", {
      method: "GET",
      params: {
        username: userId,
        gameName: name
      }
    }).then((res) => {
      console.log('🎯 Game link received:', res.link);
      const newWindow = window.open(res.link, '_blank', 'width=screen.width,height=screen.height,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,status=no');
      
      if (newWindow) {
        console.log('✅ Popup window opened successfully');
        setPopupWindow(newWindow);
        popupGameName.current = name; // Store the game name
        handlePopupOpen(name);
        
        // Check if popup is closed every 2 seconds
        popupCheckInterval.current = setInterval(() => {
          checkPopupClosed(name);
        }, 2000);
        
        // Also try to add an onbeforeunload event listener to the popup
        try {
          newWindow.onbeforeunload = () => {
            console.log(`🔄 Popup window unloading for ${name}`);
            handlePopupClose(name);
          };
        } catch (error) {
          console.log('⚠️ Could not add onbeforeunload listener (cross-origin restriction)');
        }
        
      } else {
        console.log('❌ Popup blocked by browser');
        message.error('Popup blocked by browser. Please allow popups for this site.');
      }
    }).catch((err) => {
      console.log('❌ API error:', err);
      message.error(err.response?.data?.error || 'Failed to get game link');
    }).finally(() => {
      setLoading(false);
    });
  };

  // Array of casino game companies with their logos and names
  const casinoCompanies = [
    { name: "evolution", logo: evolutionLogo },
    { name: "vivo", logo: vivoLogo },
    { name: "ezugi", logo: ezugiLogo },
    { name: "live88", logo: Live88Logo },
    { name: "virtual", logo: virtualLogo },
    { name: "jili", logo: jiliLogo },
    { name: "microgaming", logo: MicroGamingLogo },
    { name: "oriental", logo: orientalLogo },
    { name: "pgsoft", logo: PGSoftLogo },
    { name: "pragmatic", logo: PragmaticPlay },
    { name: "superspade", logo: SuperSpade },
    { name: "wm", logo: wmLiveLogo },
    { name: "xprogaming", logo: XProGamingLogo },
    { name: "alg", logo: absoluteLogo },
    { name: "inrace", logo: inraceLogo },
    { name: "globalbet", logo: globalbetLogo },
    { name: "fachai", logo: fachai },
    { name: "dreamgaming", logo: DreamGameLogo },
    { name: "dowin", logo: DowinLogo },
    { name: "bti", logo: btiLogo },
    { name: "bota", logo: botaLogo },
    { name: "bitville", logo: bitvilleLogo },
    { name: "ag", logo: AsiaGamingLogo },
  ];

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };
  
  return (
    <>
        <div className="mt-10 relative">
          <div className="flex justify-center items-center mb-4">
            <h1 className="section-title">{t("liveCasino")}</h1>
            {/* <div className="text-lg text-white">
              {t("balance")}: <span className="text-yellow-400 font-bold">{balance}</span>
            </div> */}
          </div>
          {/* Casino Game Companies Grid */}
          <div className="mt-8">
            <div className="casino-game-grid flex flex-wrap gap-4 md:gap-8 justify-center">
              {casinoCompanies.map((company, index) => (
                <div
                  key={index}
                  className="casino-game-grid-item md:max-w-[300px] max-w-[180px] rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transform transition-transform group relative"
                  onClick={() => ProcessCasino(company.name)}
                >
                  <div className="w-full h-full relative">
                    <Image
                      src={company.logo}
                      alt={`${company.name} logo`}
                      className="object-contain w-full opacity-100 rounded-t-lg border-b-1 border-[#ffd273]"
                    />
                    {/* Loading Spinner */}
                    {loading && selectedGame === company.name && (
                      <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center rounded-t-lg z-10">
                        <Spin size="large" />
                      </div>
                    )}
                    {/* Play Now Overlay */}
                    <div className="absolute inset-0 hover:bg-black-60 bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-t-lg">
                      <button className="bg-gradient-to-b cursor-pointer from-[#fce18f] to-[#774b03] text-white font-bold py-3 px-6 rounded-lg border border-[#ffe991] shadow-lg hover:from-[#774b03] hover:to-[#fce18f] transition-all duration-300 transform hover:scale-105">
                        {t("playNow")}
                      </button>
                    </div>
                  </div>
                  <div className="text-xl py-3 text-white font-bold text-center bg-image-game-item w-full">
                    {company.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Login Modal */}
        <Modal
          title={null}
          open={isLoginModalOpen}
          onCancel={handleCloseLoginModal}
          className="p-0 modal-content modal-fade-in"
          footer={null}
          width={600}
          centered
          transitionName=""
          maskTransitionName=""
        >
          <Login onClose={handleCloseLoginModal} />
        </Modal>
    </>
  );
};

export default Index;