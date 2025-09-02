import React, { useState } from 'react';
import { View } from 'react-native';
import { ProfileInputScreen } from '../screens/onboarding/ProfileInputScreen';
import { GoalSettingScreen } from '../screens/onboarding/GoalSettingScreen';
import { WorkoutHabitsScreen } from '../screens/onboarding/WorkoutHabitsScreen';
import { CompletionScreen } from '../screens/onboarding/CompletionScreen';
import { OnboardingData } from '../types/onboarding.types';

interface OnboardingNavigatorProps {
  onComplete: (data: OnboardingData) => void;
}

export const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});

  const handleNext = (data: Partial<OnboardingData>) => {
    const updatedData = { ...onboardingData, ...data };
    setOnboardingData(updatedData);

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete({
        ...updatedData,
        completedAt: new Date(),
      } as OnboardingData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const screens = [
    <ProfileInputScreen 
      key="profile" 
      onNext={handleNext} 
      onBack={handleBack}
      currentData={onboardingData} 
    />,
    <GoalSettingScreen 
      key="goal" 
      onNext={handleNext} 
      onBack={handleBack}
      currentData={onboardingData} 
    />,
    <WorkoutHabitsScreen 
      key="habits" 
      onNext={handleNext} 
      onBack={handleBack}
      currentData={onboardingData} 
    />,
    <CompletionScreen 
      key="completion" 
      onNext={handleNext} 
      onBack={handleBack}
      currentData={onboardingData} 
    />,
  ];

  return <View style={{ flex: 1 }}>{screens[currentStep]}</View>;
};