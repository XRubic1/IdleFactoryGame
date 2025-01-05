"use client";

import * as React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChevronUp, DollarSign, TrendingUp, Package, Settings } from 'lucide-react';

interface Upgrade {
  level: number;
  cost: number;
  sellPrice: number;
  salesForNextUpgrade: number | null;
}

interface GameItem {
  id: number;
  unlockCost: number;
  basePrice: number;
  maxPrice: number;
  upgrades: Upgrade[];
}

interface Multipliers {
  itemPriceMultiplier: number;
  maxPriceMultiplier: number;
  upgradeCostBase: number;
  upgradeGrowthRate: number;
  unlockCostMultiplier: number;
}

interface UnlockedItem {
  id: number;
  currentLevel: number;
}

interface PrestigeMultipliers {
  earningsMultiplier: number;
  productionSpeedMultiplier: number;
  upgradeCostReduction: number;
}

interface PrestigeCalculation {
  nextPrestigeLevel: number;
  requiredEarnings: number;
  currentProgress: number;
  timeToNextPrestige: string;
  bonusMultipliers: PrestigeMultipliers;
}

interface PrestigeUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: number;
  requires?: string[];  // IDs of upgrades required before this can be purchased
  purchased: boolean;
}

const GameProgressDashboard: React.FC = () => {
  const [selectedItem, setSelectedItem] = React.useState(1);
  const [multipliers, setMultipliers] = React.useState<Multipliers>({
    itemPriceMultiplier: 10,
    maxPriceMultiplier: 1000,
    upgradeCostBase: 10,
    upgradeGrowthRate: 1.5,
    unlockCostMultiplier: 1.15
  });
  const [productionTime, setProductionTime] = React.useState<number>(1);
  const [unlockedItems, setUnlockedItems] = React.useState<UnlockedItem[]>([
    { id: 1, currentLevel: 1 }
  ]);
  const [isUpgradeTableExpanded, setIsUpgradeTableExpanded] = React.useState(false);
  const [isMultiplierExplanationsExpanded, setIsMultiplierExplanationsExpanded] = React.useState(false);
  const [prestigeLevel, setPrestigeLevel] = React.useState(0);
  const [prestigeRequirement, setPrestigeRequirement] = React.useState(1e12); // 1 trillion base requirement
  const [prestigeScaling, setPrestigeScaling] = React.useState(10); // Each prestige requires 10x more
  const [goldenTokens, setGoldenTokens] = React.useState<number>(0);
  const [prestigeUpgrades, setPrestigeUpgrades] = React.useState<PrestigeUpgrade[]>([
    {
      id: "prod_speed_1",
      name: "Swift Production I",
      description: "Increase production speed by 25%",
      cost: 1,
      effect: 1.25,
      purchased: false
    },
    {
      id: "cost_red_1",
      name: "Bargainer I",
      description: "Reduce upgrade costs by 10%",
      cost: 2,
      effect: 0.1,
      purchased: false
    },
    {
      id: "prod_speed_2",
      name: "Swift Production II",
      description: "Increase production speed by 50%",
      cost: 3,
      effect: 1.5,
      requires: ["prod_speed_1"],
      purchased: false
    },
    {
      id: "multi_prod_1",
      name: "Multi-tasking I",
      description: "Produce 2 items at once",
      cost: 5,
      effect: 2,
      purchased: false
    }
  ]);

  const getPrestigeBonuses = (currentPrestigeLevel: number): PrestigeMultipliers => {
    return {
      earningsMultiplier: 1 + (currentPrestigeLevel + 1) * 0.5, // +50% per level
      productionSpeedMultiplier: 1 + (currentPrestigeLevel + 1) * 0.2, // +20% per level
      upgradeCostReduction: Math.min(0.9, (currentPrestigeLevel + 1) * 0.1), // 10% per level, max 90%
    };
  };

  const calculatePrestige = (
    currentEarningsPerSecond: number,
    currentPrestigeLevel: number
  ): PrestigeCalculation => {
    const baseRequirement = prestigeRequirement;
    const requiredEarnings = baseRequirement * Math.pow(prestigeScaling, currentPrestigeLevel);
    const totalEarned = currentEarningsPerSecond * 3600; // Last hour's earnings
    const progress = (totalEarned / requiredEarnings) * 100;
    
    // Calculate time to next prestige
    const secondsToPrestige = (requiredEarnings - totalEarned) / currentEarningsPerSecond;
    const days = Math.floor(secondsToPrestige / (24 * 3600));
    const hours = Math.floor((secondsToPrestige % (24 * 3600)) / 3600);
    const minutes = Math.floor((secondsToPrestige % 3600) / 60);

    return {
      nextPrestigeLevel: currentPrestigeLevel + 1,
      requiredEarnings,
      currentProgress: progress,
      timeToNextPrestige: `${days}d ${hours}h ${minutes}m`,
      bonusMultipliers: getPrestigeBonuses(currentPrestigeLevel),
    };
  };

  const generateData = (): GameItem[] => {
    const items: GameItem[] = [];
    let unlockCost = 1000;
    let basePrice = 1;
    
    // Use getPrestigeBonuses instead of calculatePrestige
    const prestigeBonus = getPrestigeBonuses(prestigeLevel);
    
    for (let i = 1; i <= 25; i++) {
      // Apply prestige earnings multiplier to prices
      const maxPrice = basePrice * multipliers.maxPriceMultiplier * prestigeBonus.earningsMultiplier;
      const priceIncreasePerLevel = (maxPrice - basePrice) / 25;
      
      const upgrades = Array.from({length: 25}, (_, level) => {
        const currentSellPrice = (basePrice + (level * priceIncreasePerLevel)) * prestigeBonus.earningsMultiplier;
        // Apply upgrade cost reduction from prestige
        const upgradeCost = Math.round(
          (currentSellPrice * 
          Math.pow(multipliers.upgradeGrowthRate, level + 1) * 
          multipliers.upgradeCostBase) * 
          (1 - prestigeBonus.upgradeCostReduction)
        );
        
        return {
          level: level + 1,
          cost: upgradeCost,
          sellPrice: Math.round(currentSellPrice),
          salesForNextUpgrade: level < 24 ? Math.ceil(
            (Math.round(currentSellPrice * 
              Math.pow(multipliers.upgradeGrowthRate, level + 2) * 
              multipliers.upgradeCostBase * 
              (1 - prestigeBonus.upgradeCostReduction))) / currentSellPrice
          ) : null
        };
      });
      
      items.push({
        id: i,
        unlockCost: Math.round(unlockCost),
        basePrice: Math.round(basePrice * prestigeBonus.earningsMultiplier),
        maxPrice: Math.round(maxPrice),
        upgrades
      });
      
      unlockCost *= (multipliers.itemPriceMultiplier * multipliers.unlockCostMultiplier);
      basePrice *= multipliers.itemPriceMultiplier;
    }
    return items;
  };

  const handleMultiplierChange = (key: string, value: string) => {
    setMultipliers(prev => ({
      ...prev,
      [key]: parseFloat(value)
    }));
  };
  
  const gameData = generateData();
  const selectedItemData = gameData[selectedItem - 1];

  const calculateTimeToAllMaxed = (items: GameItem[], productionSeconds: number) => {
    // Use getPrestigeBonuses instead of calculatePrestige
    const prestigeBonus = getPrestigeBonuses(prestigeLevel);

    // Apply production speed bonus to effective production time
    const effectiveProductionTime = productionSeconds / prestigeBonus.productionSpeedMultiplier;

    let totalSales = 0;
    let totalUnlockCost = 0;
    let timeToUnlock = 0;
    
    // Get current earnings rate first
    const currentEarnings = calculatePotentialEarnings(items, productionSeconds);
    const earningsPerSecond = currentEarnings.perSecond;
    
    // Calculate remaining costs with prestige reduction
    items.forEach((item, index) => {
      const unlockedItem = unlockedItems.find(ui => ui.id === item.id);
      
      if (!unlockedItem && index > 0) {
        totalUnlockCost += item.unlockCost;
      }
      
      if (!unlockedItem) {
        item.upgrades.forEach(upgrade => {
          if (upgrade.salesForNextUpgrade) {
            totalSales += effectiveProductionTime;
          }
        });
      } else {
        for (let level = unlockedItem.currentLevel; level < item.upgrades.length; level++) {
          if (item.upgrades[level].salesForNextUpgrade) {
            totalSales += effectiveProductionTime;
          }
        }
      }
    });

    timeToUnlock = earningsPerSecond > 0 ? totalUnlockCost / earningsPerSecond : 0;
    const totalSeconds = totalSales + timeToUnlock;
    
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return {
      totalSales: Math.ceil(totalSales / productionSeconds), // Convert back to sales count
      totalUnlockCost,
      timeString: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      totalSeconds,
      moneyNeeded: totalUnlockCost,
      currentEarningsPerSecond: earningsPerSecond
    };
  };

  const handleItemLevelChange = (itemId: number, level: number) => {
    setUnlockedItems(prev => {
      const itemExists = prev.find(item => item.id === itemId);
      if (itemExists) {
        return prev.map(item => 
          item.id === itemId ? { ...item, currentLevel: level } : item
        );
      }
      return [...prev, { id: itemId, currentLevel: level }];
    });
  };

  const toggleItemUnlock = (itemId: number) => {
    setUnlockedItems(prev => {
      const isUnlocked = prev.find(item => item.id === itemId);
      if (isUnlocked) {
        return prev.filter(item => item.id !== itemId);
      }
      return [...prev, { id: itemId, currentLevel: 1 }];
    });
  };

  const calculatePotentialEarnings = (items: GameItem[], productionSeconds: number) => {
    // Use getPrestigeBonuses instead of calculatePrestige
    const prestigeBonus = getPrestigeBonuses(prestigeLevel);
    
    let totalPerSecond = 0;
    let totalPerMinute = 0;
    let totalPerHour = 0;

    // Apply production speed bonus to effective production time
    const effectiveProductionTime = productionSeconds / prestigeBonus.productionSpeedMultiplier;

    unlockedItems.forEach(unlockedItem => {
      const item = items[unlockedItem.id - 1];
      const currentLevelPrice = item.upgrades[unlockedItem.currentLevel - 1].sellPrice;
      const itemPerSecond = currentLevelPrice / effectiveProductionTime;
      totalPerSecond += itemPerSecond;
    });

    totalPerMinute = totalPerSecond * 60;
    totalPerHour = totalPerMinute * 60;

    return {
      perSecond: totalPerSecond,
      perMinute: totalPerMinute,
      perHour: totalPerHour
    };
  };

  const unlockAllItems = () => {
    setUnlockedItems(gameData.map(item => ({
      id: item.id,
      currentLevel: 1
    })));
  };

  const setAllToMaxLevel = () => {
    setUnlockedItems(prev => 
      prev.map(item => ({
        ...item,
        currentLevel: 25 // Assuming 25 is max level
      }))
    );
  };

  const handleUpgradeItem = (itemId: number) => {
    setUnlockedItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (item && item.currentLevel < 25) { // Check if not max level
        return prev.map(i => 
          i.id === itemId ? { ...i, currentLevel: i.currentLevel + 1 } : i
        );
      }
      return prev;
    });
  };

  const calculatePrestigeRequirements = (level: number) => {
    // Base requirement starts at 1000 currency/second
    const baseRequirement = 1000;
    // Each level increases requirement exponentially
    const requirement = baseRequirement * Math.pow(3, level);
    return requirement;
  };

  const calculatePrestigeBonus = (level: number) => {
    // Start with 50% bonus, with diminishing returns
    return Math.pow(1.5, level);
  };

  const handlePrestige = () => {
    const currentEarnings = calculatePotentialEarnings(gameData, productionTime).perSecond;
    const requirement = calculatePrestigeRequirements(prestigeLevel);

    if (currentEarnings < requirement) {
      alert(`Need ${requirement.toFixed(2)} currency/second to prestige (currently: ${currentEarnings.toFixed(2)})`);
      return;
    }

    // Award golden tokens based on earnings
    const tokensEarned = Math.floor(Math.log10(currentEarnings / requirement) + 1);
    setGoldenTokens(prev => prev + tokensEarned);

    // Reset everything except prestige level and upgrades
    setUnlockedItems([{
      id: 1,
      currentLevel: 1
    }]);
    
    setPrestigeLevel(prev => prev + 1);
  };

  const purchasePrestigeUpgrade = (upgradeId: string) => {
    const upgrade = prestigeUpgrades.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.purchased) return;
    
    // Check requirements
    if (upgrade.requires?.some(req => !prestigeUpgrades.find(u => u.id === req)?.purchased)) {
      alert("You need to purchase required upgrades first!");
      return;
    }

    if (goldenTokens < upgrade.cost) {
      alert("Not enough golden tokens!");
      return;
    }

    setGoldenTokens(prev => prev - upgrade.cost);
    setPrestigeUpgrades(prev => 
      prev.map(u => u.id === upgradeId ? {...u, purchased: true} : u)
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Idle Game Economics</h1>
          <p className="text-gray-600 dark:text-gray-400">Balance Dashboard & Progression System</p>
        </div>

        {/* Multiplier Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Economy Multipliers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(multipliers).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  <span className="ml-2 text-gray-500">({value.toFixed(2)}x)</span>
                </label>
                <input
                  type="range"
                  min={key === 'unlockCostMultiplier' ? "1.05" : key === 'upgradeGrowthRate' ? "1.1" : "2"}
                  max={key === 'maxPriceMultiplier' ? "2000" : key === 'unlockCostMultiplier' ? "1.5" : key === 'upgradeGrowthRate' ? "2" : "20"}
                  step={key === 'maxPriceMultiplier' ? "100" : "0.05"}
                  value={value}
                  onChange={(e) => handleMultiplierChange(key, e.target.value)}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Implementation Details
            </h2>
            <button
              onClick={() => setIsMultiplierExplanationsExpanded(!isMultiplierExplanationsExpanded)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {isMultiplierExplanationsExpanded ? 'Collapse' : 'Expand'}
              <ChevronUp 
                className={`w-4 h-4 transform transition-transform duration-200 ${
                  isMultiplierExplanationsExpanded ? 'rotate-0' : 'rotate-180'
                }`}
              />
            </button>
          </div>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isMultiplierExplanationsExpanded ? 'max-h-[2000px]' : 'max-h-0'
          }`}>
            <div className="grid gap-6">
              {/* Multiplier Explanations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Multiplier Effects</h3>
                <div className="grid gap-4">
                  {/* Existing multiplier explanation cards */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Item Price Multiplier (x{multipliers.itemPriceMultiplier.toFixed(2)})</h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      Determines how much more expensive each new item is compared to the previous one.
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-600 p-2 rounded">
                      <code className="text-sm">
                        nextItemBasePrice = currentItemBasePrice * itemPriceMultiplier
                      </code>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Max Price Multiplier (x{multipliers.maxPriceMultiplier.toFixed(2)})</h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      Sets how much more valuable an item can become at max level.
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-600 p-2 rounded">
                      <code className="text-sm">
                        maxPrice = basePrice * maxPriceMultiplier<br />
                        priceIncreasePerLevel = (maxPrice - basePrice) / maxLevel<br />
                        currentSellPrice = basePrice + (level * priceIncreasePerLevel)
                      </code>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Upgrade Cost Base & Growth (x{multipliers.upgradeCostBase.toFixed(2)} & x{multipliers.upgradeGrowthRate.toFixed(2)})</h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      Controls upgrade costs and their growth rate.
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-600 p-2 rounded">
                      <code className="text-sm">
                        upgradeCost = currentSellPrice * (upgradeGrowthRate ^ (level + 1)) * upgradeCostBase<br />
                        salesNeeded = nextUpgradeCost / currentSellPrice
                      </code>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Unlock Cost Multiplier (x{multipliers.unlockCostMultiplier.toFixed(2)})</h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      Affects how unlock costs scale with item progression.
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-600 p-2 rounded">
                      <code className="text-sm">
                        nextUnlockCost = currentUnlockCost * (itemPriceMultiplier * unlockCostMultiplier)
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unity Implementation Guide */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Unity Implementation</h3>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Implementation Details
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Prestige System Overview */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Prestige System
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        The prestige system allows players to reset their progress in exchange for permanent bonuses and golden tokens.
                        These tokens can be spent on permanent upgrades in the prestige tree.
                      </p>
                    </div>

                    {/* Web Implementation */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Web Implementation
                      </h3>
                      <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <pre className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg overflow-x-auto">
                          {`// Calculate tokens earned
const tokensEarned = Math.floor(Math.log10(currentEarnings / requirement) + 1);

// Example scaling:
1x requirement = 1 token
10x requirement = 2 tokens
100x requirement = 3 tokens
1000x requirement = 4 tokens`}
                        </pre>
                      </div>
                    </div>

                    {/* Unity Implementation */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Unity Implementation
                      </h3>
                      <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <pre className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg overflow-x-auto">
                          {`// C# Implementation
public class PrestigeSystem : MonoBehaviour
{
    [SerializeField] private float baseRequirement = 1000f;
    [SerializeField] private float requirementScaling = 3f;
    
    private int prestigeLevel;
    private int goldenTokens;
    
    public int CalculateTokensEarned(float currentEarnings)
    {
        float requirement = baseRequirement * Mathf.Pow(requirementScaling, prestigeLevel);
        if (currentEarnings < requirement) return 0;
        
        return Mathf.FloorToInt(Mathf.Log10(currentEarnings / requirement) + 1);
    }
    
    public void Prestige()
    {
        float currentEarnings = GameManager.Instance.GetCurrentEarnings();
        int tokensEarned = CalculateTokensEarned(currentEarnings);
        
        if (tokensEarned > 0)
        {
            goldenTokens += tokensEarned;
            prestigeLevel++;
            ResetProgress();
            ApplyPrestigeBonuses();
        }
    }
    
    private void ResetProgress()
    {
        // Reset all items except first
        GameManager.Instance.ResetToBaseState();
        // Keep prestige upgrades
        SavePrestigeData();
    }
}`}
                        </pre>
                      </div>
                    </div>

                    {/* Save System */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Save System Integration
                      </h3>
                      <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <pre className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg overflow-x-auto">
                          {`[System.Serializable]
public class PrestigeData
{
    public int prestigeLevel;
    public int goldenTokens;
    public List<string> purchasedUpgrades;
    
    public string ToJson()
    {
        return JsonUtility.ToJson(this);
    }
    
    public static PrestigeData FromJson(string json)
    {
        return JsonUtility.FromJson<PrestigeData>(json);
    }
}`}
                        </pre>
                      </div>
                    </div>

                    {/* Key Considerations */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Key Considerations
                      </h3>
                      <ul className="mt-2 list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>Save prestige data separately from main game save</li>
                        <li>Use ScriptableObjects for upgrade definitions</li>
                        <li>Implement offline progress calculation</li>
                        <li>Add visual feedback for prestige rewards</li>
                        <li>Include confirmation dialog for prestige reset</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Item Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-4">
            <Package className="w-6 h-6 text-blue-500" />
            <select 
              className="flex-1 p-2 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={selectedItem}
              onChange={(e) => setSelectedItem(Number(e.target.value))}
            >
              {gameData.map(item => (
                <option key={item.id} value={item.id}>
                  Item {item.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Unlock Cost</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${selectedItemData.unlockCost.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Base Price</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${selectedItemData.basePrice.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <ChevronUp className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Max Price</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${selectedItemData.maxPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex justify-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Progression Chart</h2>
          <div className="w-full overflow-x-auto">
            <LineChart
              width={800}
              height={400}
              data={selectedItemData.upgrades}
              margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
            >
              <XAxis dataKey="level" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB' }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="cost" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Upgrade Cost"
              />
              <Line 
                type="monotone" 
                dataKey="sellPrice" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Sell Price"
              />
            </LineChart>
          </div>
        </div>

        {/* Upgrade Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Upgrade Details
            </h2>
            <button
              onClick={() => setIsUpgradeTableExpanded(!isUpgradeTableExpanded)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {isUpgradeTableExpanded ? 'Collapse' : 'Expand'}
              <ChevronUp 
                className={`w-4 h-4 transform transition-transform duration-200 ${
                  isUpgradeTableExpanded ? 'rotate-0' : 'rotate-180'
                }`}
              />
            </button>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isUpgradeTableExpanded ? 'max-h-[2000px]' : 'max-h-0'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Upgrade Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sell Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sales Needed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedItemData.upgrades.map((upgrade, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {upgrade.level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        ${upgrade.cost.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        ${upgrade.sellPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {upgrade.salesForNextUpgrade ? upgrade.salesForNextUpgrade.toLocaleString() : 'Max Level'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Production Time Input */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Production Settings</h2>
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Production Time (seconds):
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={productionTime}
                onChange={(e) => setProductionTime(Number(e.target.value))}
                className="ml-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </label>
          </div>
          
          {/* Time to Max Level Display */}
          {selectedItemData && (
            <>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Time to Max All Items
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales Needed</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {calculateTimeToAllMaxed(gameData, productionTime).totalSales.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Money Needed for Unlocks</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      ${calculateTimeToAllMaxed(gameData, productionTime).totalUnlockCost.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Total Time</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {calculateTimeToAllMaxed(gameData, productionTime).timeString}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Seconds</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {calculateTimeToAllMaxed(gameData, productionTime).totalSeconds.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Add this new section */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Next Prestige Progress
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Progress</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {calculatePrestige(
                          calculatePotentialEarnings(gameData, productionTime).perSecond,
                          prestigeLevel
                        ).currentProgress.toFixed(2)}%
                      </p>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                          className="h-2 bg-purple-600 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, calculatePrestige(
                              calculatePotentialEarnings(gameData, productionTime).perSecond,
                              prestigeLevel
                            ).currentProgress)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Required Earnings</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      ${calculatePrestige(
                        calculatePotentialEarnings(gameData, productionTime).perSecond,
                        prestigeLevel
                      ).requiredEarnings.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Time to Next Prestige</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {calculatePrestige(
                        calculatePotentialEarnings(gameData, productionTime).perSecond,
                        prestigeLevel
                      ).timeToNextPrestige}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Add Potential Earnings Display after Production Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Potential Earnings (With {selectedItem} Items)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Per Second</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${calculatePotentialEarnings(gameData, productionTime).perSecond.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Per Minute</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${calculatePotentialEarnings(gameData, productionTime).perMinute.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Per Hour</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${calculatePotentialEarnings(gameData, productionTime).perHour.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Add this new section for Unlocked Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Unlocked Items & Levels
            </h2>
            <div className="flex gap-2">
              <button
                onClick={unlockAllItems}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                Unlock All Items
              </button>
              <button
                onClick={setAllToMaxLevel}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                Max All Levels
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameData.map(item => {
              const unlockedItem = unlockedItems.find(ui => ui.id === item.id);
              const nextUpgradeCost = unlockedItem 
                ? (unlockedItem.currentLevel < 25 
                  ? item.upgrades[unlockedItem.currentLevel].cost 
                  : null)
                : null;

              return (
                <div 
                  key={item.id}
                  className={`p-4 rounded-lg border-2 ${
                    unlockedItem 
                      ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Item {item.id}
                    </span>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => toggleItemUnlock(item.id)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          unlockedItem
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {unlockedItem ? 'Unlocked' : 'Locked'}
                      </button>
                      {unlockedItem && unlockedItem.currentLevel < 25 && (
                        <button
                          onClick={() => handleUpgradeItem(item.id)}
                          className="px-3 py-1 rounded-full text-sm bg-blue-500 text-white hover:bg-blue-600"
                        >
                          Upgrade
                        </button>
                      )}
                    </div>
                  </div>
                  {unlockedItem ? (
                    <div className="mt-2">
                      <label className="block text-sm text-gray-600 dark:text-gray-400">
                        Current Level:
                        <select
                          value={unlockedItem.currentLevel}
                          onChange={(e) => handleItemLevelChange(item.id, Number(e.target.value))}
                          className="ml-2 p-1 rounded border dark:bg-gray-700 dark:border-gray-600"
                        >
                          {item.upgrades.map(upgrade => (
                            <option key={upgrade.level} value={upgrade.level}>
                              Level {upgrade.level}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Selling for: ${item.upgrades[unlockedItem.currentLevel - 1].sellPrice.toLocaleString()}
                      </div>
                      {nextUpgradeCost && (
                        <div className="mt-1 text-sm text-blue-500 dark:text-blue-400">
                          Next upgrade: ${nextUpgradeCost.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div className="text-sm text-orange-500 dark:text-orange-400">
                        Unlock cost: ${item.unlockCost.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Starting price: ${item.basePrice.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Prestige Calculator
          </h2>
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Prestige Level</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{prestigeLevel}</p>
              </div>
              <button
                onClick={handlePrestige}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Prestige Now
              </button>
            </div>

            {/* Prestige Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Progress to Next Prestige</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {calculatePrestige(
                    calculatePotentialEarnings(gameData, productionTime).perSecond,
                    prestigeLevel
                  ).currentProgress.toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, calculatePrestige(
                      calculatePotentialEarnings(gameData, productionTime).perSecond,
                      prestigeLevel
                    ).currentProgress)}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Prestige Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Required Earnings</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  ${calculatePrestige(
                    calculatePotentialEarnings(gameData, productionTime).perSecond,
                    prestigeLevel
                  ).requiredEarnings.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Time to Next Prestige</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {calculatePrestige(
                    calculatePotentialEarnings(gameData, productionTime).perSecond,
                    prestigeLevel
                  ).timeToNextPrestige}
                </p>
              </div>
            </div>

            {/* Prestige Bonuses */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Next Prestige Bonuses</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Earnings Multiplier</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {calculatePrestige(
                      calculatePotentialEarnings(gameData, productionTime).perSecond,
                      prestigeLevel
                    ).bonusMultipliers.earningsMultiplier.toFixed(2)}x
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Production Speed</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {calculatePrestige(
                      calculatePotentialEarnings(gameData, productionTime).perSecond,
                      prestigeLevel
                    ).bonusMultipliers.productionSpeedMultiplier.toFixed(2)}x
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Upgrade Cost Reduction</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {(calculatePrestige(
                      calculatePotentialEarnings(gameData, productionTime).perSecond,
                      prestigeLevel
                    ).bonusMultipliers.upgradeCostReduction * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Prestige Requirements */}
            <div className="space-y-2">
              <span className="text-gray-500 dark:text-gray-400">
                Required: {calculatePrestigeRequirements(prestigeLevel).toFixed(2)} currency/second
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                Current Bonus: {((calculatePrestigeBonus(prestigeLevel) - 1) * 100).toFixed(1)}%
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                Next Bonus: {((calculatePrestigeBonus(prestigeLevel + 1) - 1) * 100).toFixed(1)}%
              </span>
            </div>

            <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Implementation Details
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Golden Token Rewards</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tokens earned = floor(log10(current/required) + 1)
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                    <li>Meeting requirement (1x) = 1 token</li>
                    <li>10x requirement = 2 tokens</li>
                    <li>100x requirement = 3 tokens</li>
                    <li>1000x requirement = 4 tokens</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Requirements</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Next prestige requires: {calculatePrestigeRequirements(prestigeLevel).toLocaleString()} currency/second
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Formula: {1000} × 3^(prestige level)
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Current Progress</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your earnings: {calculatePotentialEarnings(gameData, productionTime).perSecond.toLocaleString()} /sec
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Potential tokens: {Math.max(0, Math.floor(Math.log10(
                      calculatePotentialEarnings(gameData, productionTime).perSecond / 
                      calculatePrestigeRequirements(prestigeLevel)
                    ) + 1))} at current production
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Golden Tokens Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Golden Tokens
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You have {goldenTokens} golden tokens.
          </p>
        </div>

        {/* Prestige Upgrades Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Prestige Upgrades
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prestigeUpgrades.map(upgrade => (
              <div 
                key={upgrade.id}
                className={`p-4 rounded-lg border-2 ${
                  upgrade.purchased
                    ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {upgrade.name}
                  </span>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => purchasePrestigeUpgrade(upgrade.id)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        upgrade.purchased
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {upgrade.purchased ? 'Purchased' : 'Purchase'}
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {upgrade.description}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Cost: {upgrade.cost} golden tokens
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Effect: {upgrade.effect.toFixed(2)}x
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prestige Tree Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Prestige Tree
            </h2>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-bold text-yellow-500">
                {goldenTokens} Golden Tokens
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prestigeUpgrades.map(upgrade => {
              const canPurchase = goldenTokens >= upgrade.cost && 
                (!upgrade.requires?.length || 
                  upgrade.requires.every(req => 
                    prestigeUpgrades.find(u => u.id === req)?.purchased
                  )
                );
              
              return (
                <div 
                  key={upgrade.id}
                  className={`
                    p-4 rounded-lg border-2 
                    ${upgrade.purchased 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : canPurchase
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-300 bg-gray-50 dark:bg-gray-700/50'
                    }
                  `}
                >
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">
                    {upgrade.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {upgrade.description}
                  </p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-yellow-500 font-bold">
                      Cost: {upgrade.cost} tokens
                    </span>
                    <button
                      onClick={() => purchasePrestigeUpgrade(upgrade.id)}
                      disabled={upgrade.purchased || !canPurchase}
                      className={`
                        px-3 py-1 rounded-md text-sm font-medium
                        ${upgrade.purchased
                          ? 'bg-green-500 text-white cursor-not-allowed'
                          : canPurchase
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }
                      `}
                    >
                      {upgrade.purchased ? 'Purchased' : 'Buy'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameProgressDashboard; 