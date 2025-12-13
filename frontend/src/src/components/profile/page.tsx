"use client";
import React, { ChangeEvent, useState, useEffect, useRef } from "react";
import { Button, Card, Form, Input, Space } from "antd";
import { useTranslations } from "next-intl";
import { useAtom } from "jotai";
import { userState } from "@/state/state";
import { useMutation, useQuery } from "@apollo/client";
import { GET_PROFILE, UPDATE_PROFILE } from "@/actions/profile";
import Image from "next/image";
import modalImage from '@/assets/img/main/modal-head.png';
import { SiDepositphotos } from "react-icons/si";
import { Progress } from "antd";
import api from "@/api";

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
import Level11 from "@/assets/img/level/lv11.png"
import Level12 from "@/assets/img/level/lv12.png"
import LevelVIP1 from "@/assets/img/level/Vip1.png"
import LevelVIP2 from "@/assets/img/level/Vip2.png"
import Prumium from "@/assets/img/level/premium.png"

const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 8,
    },
  },
};

const ProfilePage: React.FC<{checkoutModal: (modal: string) => void}> = (props) => {
    const t = useTranslations();
    const [form] = Form.useForm();
    const [user] = useAtom<any>(userState);
    const { loading, error, data } = useQuery(GET_PROFILE);
    const [updateProfile, updateResult] = useMutation(UPDATE_PROFILE);

    // Level state values - these will be updated from real-time data
    const [currentLevelNumber, setCurrentLevelNumber] = useState<number>(1);
    const [currentLevelPercent, setCurrentLevelPercent] = useState<number>(0);
    
    // Wager and levels data
    const [wager, setWager] = useState<number>(0);
    const [levels, setLevels] = useState<Array<{
        id: number;
        name: string;
        levelNumber: number;
        levelType: string;
        nextLevelTargetValue: number;
    }>>([]);
    
    // Animation states
    const [animatedPercent, setAnimatedPercent] = useState<number>(0);
    const [displayPercent, setDisplayPercent] = useState<number>(0);
    const [isLevelChanging, setIsLevelChanging] = useState<boolean>(false);
    const previousLevelRef = useRef<number>(1);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const onFinish = async (values: any) => {
      // console.log("Received values of form: ", values);
      const u = {
        userId: user.id,
        ...values,
      };
      delete values["agreement"];
      delete values["holderName"];
      updateProfile({
        variables: {
          input: values,
        },
      }).then((res) => {
        console.log({ res });
      });
      console.log({ u });
    };
    // console.log({ loading, error }, data?.profile);

    const onNewPasswordChange = (v: ChangeEvent<HTMLInputElement>) => {
      console.log({ v });
    };

    // Function to get level image based on level number
    const getLevelImage = (level: number) => {
      if (level >= 1 && level <= 12) {
        const levelImages = [Level1, Level2, Level3, Level4, Level5, Level6, Level7, Level8, Level9, Level10, Level11, Level12];
        return levelImages[level - 1];
      } else if (level === 13) {
        return LevelVIP1;
      } else if (level === 14) {
        return LevelVIP2;
      } else if (level === 15) {
        return Prumium;
      }
      return Level1;
    };

    // Animate progress bar when percent changes
    useEffect(() => {
      const duration = 1000; // 1 second animation
      const startPercent = animatedPercent;
      const endPercent = currentLevelPercent;
      const startTime = Date.now();

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);
        
        const currentPercent = startPercent + (endPercent - startPercent) * easedProgress;
        setAnimatedPercent(currentPercent);
        setDisplayPercent(Math.round(currentPercent));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setAnimatedPercent(endPercent);
          setDisplayPercent(Math.round(endPercent));
        }
      };

      if (startPercent !== endPercent) {
        requestAnimationFrame(animate);
      }
    }, [currentLevelPercent]);

    // Animate level change
    useEffect(() => {
      if (previousLevelRef.current !== currentLevelNumber) {
        setIsLevelChanging(true);
        const timer = setTimeout(() => {
          setIsLevelChanging(false);
        }, 600);
        previousLevelRef.current = currentLevelNumber;
        return () => clearTimeout(timer);
      }
    }, [currentLevelNumber]);

    // Fetch wager and level targets
    const fetchWagerAndLevelTargets = async () => {
        try {
            const response = await api("user/wager-and-level-targets", {
                method: "GET",
            });
            
            console.log("API Response:", response);
            
            if (response.wager !== undefined) {
                setWager(response.wager);
            }
            
            if (response.levels && Array.isArray(response.levels)) {
                setLevels(response.levels);
                
                // Calculate current level and progress based on wager
                const sortedLevels = [...response.levels].sort((a, b) => a.levelNumber - b.levelNumber);
                const currentWager = response.wager || 0;
                
                console.log("Sorted levels:", sortedLevels);
                console.log("Current wager:", currentWager);
                
                // Find current level: the highest level where wager < nextLevelTargetValue
                let currentLevel = sortedLevels[0]; // Default to first level
                let previousLevel: typeof sortedLevels[0] | null = null;
                
                for (let i = 0; i < sortedLevels.length; i++) {
                    if (currentWager < sortedLevels[i].nextLevelTargetValue) {
                        currentLevel = sortedLevels[i];
                        // Previous level is the one before current (if exists)
                        if (i > 0) {
                            previousLevel = sortedLevels[i - 1];
                        }
                        break;
                    }
                }
                
                // If wager exceeds all levels, user is at max level
                if (currentWager >= sortedLevels[sortedLevels.length - 1].nextLevelTargetValue) {
                    currentLevel = sortedLevels[sortedLevels.length - 1];
                    previousLevel = sortedLevels[sortedLevels.length - 2] || null;
                }
                
                console.log("Current level:", currentLevel);
                console.log("Previous level:", previousLevel);
                
                setCurrentLevelNumber(currentLevel.levelNumber);
                
                // Calculate progress percentage
                // Formula:
                // 1. Level difference value = nextLevelTargetValue of current level - nextLevelTargetValue of previous level (or 0 if level 1)
                // 2. Wager value for current level = wager - nextLevelTargetValue of previous level (or wager if level 1)
                // 3. Percentage = (wager value for current level / level difference value) * 100
                // Example: Level 1 (15000), Level 2 (50000), wager = 100
                // - If at Level 1: level difference = 15000 - 0 = 15000, wager value = 100 - 0 = 100, percent = (100 / 15000) * 100
                // - If at Level 2: level difference = 50000 - 15000 = 35000, wager value = 100 - 15000 = -14900 (but should be 0 if negative)
                
                const previousLevelTarget = previousLevel ? previousLevel.nextLevelTargetValue : 0;
                const currentLevelTarget = currentLevel.nextLevelTargetValue;
                
                // Level difference value = current level target - previous level target
                const levelDifference = currentLevelTarget - previousLevelTarget;
                
                // Wager value for current level = wager - previous level target (minimum 0)
                const wagerForCurrentLevel = Math.max(0, currentWager - previousLevelTarget);
                
                console.log('Level Calculation:', {
                    currentLevel: currentLevel.levelNumber,
                    previousLevel: previousLevel ? previousLevel.levelNumber : 0,
                    previousLevelTarget,
                    currentLevelTarget,
                    levelDifference,
                    currentWager,
                    wagerForCurrentLevel,
                    calculatedProgress: levelDifference > 0 ? (wagerForCurrentLevel / levelDifference) * 100 : 0
                });
                
                const progress = levelDifference > 0 ? (wagerForCurrentLevel / levelDifference) * 100 : 0;
                console.log("Setting progress to:", progress);
                setCurrentLevelPercent(Math.max(0, Math.min(100, progress)));
            } else {
                console.warn("No levels found in response:", response);
            }
        } catch (error) {
            console.error("Error fetching wager and level targets:", error);
        }
    };

    // Poll wager and level targets every 5 seconds
    useEffect(() => {
        // Initial fetch
        fetchWagerAndLevelTargets();
        
        // Set up interval to fetch every 5 seconds
        const interval = setInterval(fetchWagerAndLevelTargets, 5000);
        
        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);
  return (
    <div className="flex justify-center items-center">
      <Form
        form={form}
        className="pr-4"
        name="profile"
        layout="vertical"
        style={{ maxWidth: 800, width: "100%" }}
        onFinish={onFinish}
        initialValues={{
          ...user,
          ...data?.profile,
        }}
        scrollToFirstError
      >
        <Card
          title={
            <>
              <h2 className="text-[#edd497] text-[40px] justify-center flex pt-10 font-bold">{t("PROFILE")}</h2>
              <p className="text-white text-[16px] font-[400] justify-center pb-6 flex">{t("profile")}</p>
            </>
          }
          className="w-full login-card"
          classNames={{
            body: "px-6 py-6",
          }}
          styles={{
            header: {
              backgroundImage: `url(${modalImage.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            },
            body: {
              backgroundColor: '#160d0c',
              borderTop: 'none',
              padding: "0px 30px"
            }
          }}
        >
          <div className="flex w-full mb-6 bg-gradient-to-r from-[#2a1810] to-[#3e2a1f] rounded-lg overflow-hidden border border-[#5d4a3a]">
          <button
            onClick={() => props.checkoutModal("profile")}
            className="flex-1 flex items-center justify-center gap-2 cursor-pointer text-[15px] px-4 py-3 bg-[#4a3224] text-[#edd497] font-bold border-r border-[#5d4a3a] hover:bg-[#5a3a2a] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512" ><path d="M238.6 58.1C248.4 48.9 263.6 48.9 273.4 58.1L345.6 125.0L345.6 115.2C345.6 101.0 357.0 89.6 371.2 89.6L396.8 89.6C411.0 89.6 422.4 101.0 422.4 115.2L422.4 196.4L452.6 224.5C460.3 231.7 462.9 242.8 459.0 252.6C455.2 262.3 446.0 268.8 435.2 268.8L422.4 268.8L422.4 409.6C422.4 438.6 399.4 461.6 370.4 461.6L141.6 461.6C112.6 461.6 89.6 438.6 89.6 409.6L89.6 268.8L76.8 268.8C66.0 268.8 56.8 262.3 53.0 252.6C49.1 242.8 51.7 231.7 59.4 224.5L238.6 58.1zM300.8 256.0C300.8 231.3 280.7 211.2 256.0 211.2C231.3 211.2 211.2 231.3 211.2 256.0C211.2 280.7 231.3 300.8 256.0 300.8C280.7 300.8 300.8 280.7 300.8 256.0zM166.4 396.8C166.4 403.8 172.2 409.6 179.2 409.6L332.8 409.6C339.8 409.6 345.6 403.8 345.6 396.8C345.6 361.4 317.4 332.8 282.0 332.8L230.4 332.8C195.0 332.8 166.4 361.4 166.4 396.8z"/></svg>
            {t("profile")}
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 cursor-pointer text-[15px] px-4 py-3 text-white hover:bg-[#2a1810] transition-colors"
            onClick={() => props.checkoutModal("letter")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 512 512"  fill="white"  ><path d="M128 76.8C99.8 76.8 76.8 99.8 76.8 128L76.8 384C76.8 412.2 99.8 435.2 128 435.2L384 435.2C412.2 435.2 435.2 412.2 435.2 384L435.2 128C435.2 99.8 412.2 76.8 384 76.8L128 76.8zM244.1 265.5L163.5 217.1C157.4 213.4 153.6 206.8 153.6 199.6C153.6 188.3 162.7 179.2 174.0 179.2L337.9 179.2C349.2 179.2 358.3 188.3 358.3 199.6C358.3 206.8 354.5 213.4 348.4 217.1L267.9 265.5C264.3 267.7 260.3 268.8 256 268.8C251.7 268.8 247.7 267.7 244.1 265.5zM358.4 241.0L358.4 307.2C358.4 321.4 346.9 332.8 332.8 332.8L179.2 332.8C165.0 332.8 153.6 321.4 153.6 307.2L153.6 241.0L230.9 287.4C238.5 292.0 247.2 294.4 256 294.4C264.8 294.4 273.5 292.0 281.1 287.4L358.4 241.0z"/></svg>
            {t("letter")}
          </button>
          <button 
            className="flex-1 flex items-center justify-center gap-2 cursor-pointer text-[15px] px-4 py-3 text-white hover:bg-[#2a1810] transition-colors border-r border-[#5d4a3a]"
            onClick={() => props.checkoutModal("qna")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 512 512" fill="white" ><path d="M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.3-2.8 5.7-1.5 8.7S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4 32.7 12.3 69 19.4 107.4 19.4 141.4 0 256-93.1 256-208S397.4 32 256 32zM128 272c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128 0c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128 0c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z"/></svg>
            {t("QNA")}
          </button>
        </div>
        {/* Animated Level Display */}
        <div className="mb-6 relative">
          <div className="flex items-center gap-4 mb-3">
            <div 
              className={`relative transition-all duration-500 ${
                isLevelChanging ? 'scale-110 animate-pulse' : 'scale-100'
              }`}
              style={{
                filter: isLevelChanging ? 'drop-shadow(0 0 20px rgba(255, 193, 7, 0.8))' : 'none',
              }}
            >
              <Image 
                src={getLevelImage(currentLevelNumber)} 
                alt={`Level ${currentLevelNumber}`} 
                width={100} 
                height={100}
                className="transition-all duration-500"
                priority
              />
              {isLevelChanging && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent animate-shimmer" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#edd497] text-lg font-bold">
                    Level {currentLevelNumber}
                  </span>
                  {isLevelChanging && (
                    <span className="text-yellow-400 text-xs font-semibold animate-bounce">
                      ↑ Level Up!
                    </span>
                  )}
                </div>
                <span 
                  className="text-[#edd497] text-lg font-bold min-w-[50px] text-right transition-all duration-300"
                  style={{
                    transform: isLevelChanging ? 'scale(1.2)' : 'scale(1)',
                    color: isLevelChanging ? '#ffc107' : '#edd497',
                  }}
                >
                  {displayPercent}%
                </span>
              </div>
              <div className="relative w-full h-6 bg-gradient-to-r from-[#2a1810] to-[#3e2a1f] rounded-full overflow-hidden border border-[#5d4a3a] shadow-inner">
                <div 
                  ref={progressBarRef}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#ffc107] via-[#ffd54f] to-[#ffc107] rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{
                    width: `${animatedPercent}%`,
                    boxShadow: animatedPercent > 0 
                      ? '0 0 10px rgba(255, 193, 7, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.2)' 
                      : 'none',
                  }}
                >
                  {/* Shimmer effect on progress bar */}
                  {animatedPercent > 0 && (
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
                      style={{
                        width: '30%',
                      }}
                    />
                  )}
                </div>
                {/* Progress bar glow effect */}
                {animatedPercent >= 100 && (
                  <div 
                    className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-[#ffc107] via-[#ffd54f] to-[#ffc107] rounded-full animate-pulse"
                    style={{ opacity: 0.5 }}
                  />
                )}
              </div>
              {/* Level progress text */}
              <div className="flex justify-between items-center mt-1 text-xs text-gray-400">
                <span>Progress to Next Level</span>
                <span className="text-[#edd497]">
                  {displayPercent}% Complete
                </span>
              </div>
            </div>
          </div>
        </div>
          {user.id && data?.profile?.id ? (
            <>
              <Space.Compact className="w-full gap-2">
            <Form.Item
              name="userid"
              className="w-full"
              label={<span className="text-white font-medium">{t("ID")}</span>}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input className="custom-white-input" />
            </Form.Item>
            <Form.Item
              name="nickname"
              className="w-full"
              label={<span className="text-white font-medium">{t("nickname")}</span>}
              rules={[
                {
                  required: true,
                  whitespace: true,
                },
              ]}
            >
              <Input className="custom-white-input" />
            </Form.Item>
          </Space.Compact>
          <Space.Compact className="w-full gap-2">
            <Form.Item
              className="w-full"
              name="bankName"
              label={<span className="text-white font-medium">{t("bank")}</span>}
              rules={[{ required: true }]}
            >
              {/* 
              <Space.Compact>
                <Form.Item
                  name="bankName"
                  noStyle
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <Select
                    // defaultValue="SB"
                    style={{ width: 120 }}
                    // onChange={handleChange}
                    options={[
                      { value: "SB", label: "SB" },
                      { value: "CK", label: "CK" },
                      { value: "CN", label: "CN" },
                    ]}
                  />
                </Form.Item>
              </Space.Compact> */}
              <Input className="custom-white-input" />
            </Form.Item>
            <Form.Item
              name="holderName"
              className="w-full"
              label={<span className="text-white font-medium">{t("holderName")}</span>}
              // rules={[{ required: true }]}
            >
              <Input disabled className="custom-white-input" />
            </Form.Item>
          </Space.Compact>

          <Space.Compact className="w-full gap-2">
            <Form.Item
              name="accountNumber"
              className="w-full"
              label={<span className="text-white font-medium">{t("accountNumber")}</span>}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input className="custom-white-input" />
            </Form.Item>
            <Form.Item
              name="phone"
              className="w-full"
              label={<span className="text-white font-medium">{t("phone")}</span>}
              rules={[{ required: true }]}
            >
              <Input style={{ width: "100%" }} className="custom-white-input" />
            </Form.Item>
          </Space.Compact>
          <Space.Compact className="w-full gap-2">
            <Form.Item
              name="currentPassword"
              className="w-full"
              label={<span className="text-white font-medium">{t("currentPassword")}</span>}
              rules={[
                {
                  required: true,
                },
              ]}
              hasFeedback
            >
              <Input.Password className="custom-white-input" />
            </Form.Item>
          </Space.Compact>
          <Space.Compact className="w-full gap-2">
            <Form.Item
              name="newPassword"
              className="w-full"
              label={<span className="text-white font-medium">{t("newPassword")}</span>}
              rules={[
                {
                  // required: true,
                },
              ]}
              hasFeedback
            >
              <Input.Password onChange={onNewPasswordChange} className="custom-white-input" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              className="w-full"
              label={<span className="text-white font-medium">{t("password2")}</span>}
              dependencies={["password"]}
              hasFeedback
              rules={[
                {
                  // required: true,
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        "The new password that you entered do not match!"
                      )
                    );
                  },
                }),
              ]}
            >
              <Input.Password className="custom-white-input" />
            </Form.Item>
          </Space.Compact>

          {/*  <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error("Should accept agreement")),
              },
            ]}
            {...tailFormItemLayout}
          >
            <Checkbox>{t("tos")}</Checkbox>
          </Form.Item> */}
          <div className="flex gap-2 pt-3 w-[80%] mx-auto">
            <Form.Item label={null} className="w-full">
              <button
                type="submit"
                className="w-full btn-modal-auth cursor-pointer"
              >
                {t("submit")}
              </button>
            </Form.Item>
            <Form.Item label={null} className="w-full">
              <button
                type="reset"
                className="w-full btn-modal-auth cursor-pointer"
              >
                {t("reset")}
              </button>
            </Form.Item>
              </div>
            </>
          ) : (
            <div className="text-white text-center py-8">
              {loading ? t("loading") : t("noData")}
            </div>
          )}
        </Card>
      </Form>
    </div>
  );
};

export default ProfilePage;
