#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <unordered_map>
#include <cmath>
#include <algorithm>
#include <iomanip>
#include <numeric>
#include <cctype>

// Helper to extract double value from JSON string
double getDoubleField(const std::string& line, const std::string& key) {
    std::string searchKey = "\"" + key + "\":";
    size_t pos = line.find(searchKey);
    if (pos == std::string::npos) return std::nan("");
    pos += searchKey.length();
    while (pos < line.length() && (line[pos] == ' ' || line[pos] == '\t')) {
        pos++;
    }
    if (pos >= line.length()) return std::nan("");
    if (line.compare(pos, 4, "null") == 0) {
        return std::nan("");
    }
    size_t endPos = pos;
    while (endPos < line.length() && 
           (std::isdigit(line[endPos]) || line[endPos] == '.' || line[endPos] == '-' || line[endPos] == 'e' || line[endPos] == 'E')) {
        endPos++;
    }
    try {
        return std::stod(line.substr(pos, endPos - pos));
    } catch (...) {
        return std::nan("");
    }
}

// Helper to extract string value from JSON string
std::string getStringField(const std::string& line, const std::string& key) {
    std::string searchKey = "\"" + key + "\":";
    size_t pos = line.find(searchKey);
    if (pos == std::string::npos) return "";
    pos += searchKey.length();
    while (pos < line.length() && (line[pos] == ' ' || line[pos] == '\t')) {
        pos++;
    }
    if (pos >= line.length()) return "";
    if (line[pos] == '\"') {
        pos++;
        size_t endPos = line.find('\"', pos);
        if (endPos == std::string::npos) return "";
        return line.substr(pos, endPos - pos);
    }
    if (line.compare(pos, 4, "null") == 0) {
        return "";
    }
    size_t endPos = pos;
    while (endPos < line.length() && line[endPos] != ',' && line[endPos] != '}' && line[endPos] != ']') {
        endPos++;
    }
    return line.substr(pos, endPos - pos);
}

// Helper to extract uint64_t from JSON string
uint64_t getUint64Field(const std::string& line, const std::string& key) {
    std::string searchKey = "\"" + key + "\":";
    size_t pos = line.find(searchKey);
    if (pos == std::string::npos) return 0;
    pos += searchKey.length();
    while (pos < line.length() && (line[pos] == ' ' || line[pos] == '\t')) {
        pos++;
    }
    if (pos >= line.length()) return 0;
    if (line.compare(pos, 4, "null") == 0) return 0;
    size_t endPos = pos;
    while (endPos < line.length() && std::isdigit(line[endPos])) {
        endPos++;
    }
    try {
        return std::stoull(line.substr(pos, endPos - pos));
    } catch (...) {
        return 0;
    }
}

int main() {
    std::string line;
    // Rolling windows of price, volume, and spread per ticker
    std::unordered_map<std::string, std::vector<double>> priceHistories;
    std::unordered_map<std::string, std::vector<double>> volumeHistories;
    std::unordered_map<std::string, std::vector<double>> spreadHistories;
    std::unordered_map<std::string, double> sessionOpenPrices;
    const size_t WINDOW_SIZE = 20;

    std::cout << std::fixed << std::setprecision(6);

    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;

        std::string sym = getStringField(line, "symbol");
        if (sym.empty()) {
            sym = getStringField(line, "sym"); // Fallback key
        }
        if (sym.empty()) continue;

        std::string assetType = getStringField(line, "assetType");
        if (assetType.empty()) {
            assetType = "stock"; // Default fallback
        }

        double lastPrice = getDoubleField(line, "lastPrice");
        double volume = getDoubleField(line, "volume");
        double bp = getDoubleField(line, "bidPrice");
        double bs = getDoubleField(line, "bidSize");
        double ap = getDoubleField(line, "askPrice");
        double as = getDoubleField(line, "askSize");
        uint64_t t = getUint64Field(line, "timestamp");

        // If lastPrice is not provided but bid/ask exists, average them
        if (std::isnan(lastPrice) && !std::isnan(bp) && !std::isnan(ap)) {
            lastPrice = (bp + ap) * 0.5;
        }

        // Store histories
        if (!std::isnan(lastPrice) && lastPrice > 0) {
            priceHistories[sym].push_back(lastPrice);
            if (priceHistories[sym].size() > WINDOW_SIZE) {
                priceHistories[sym].erase(priceHistories[sym].begin());
            }
        }

        if (!std::isnan(volume) && volume >= 0) {
            volumeHistories[sym].push_back(volume);
            if (volumeHistories[sym].size() > WINDOW_SIZE) {
                volumeHistories[sym].erase(volumeHistories[sym].begin());
            }
        }

        // Compute metrics
        double spread = std::nan("");
        double spreadPercent = std::nan("");

        if (!std::isnan(bp) && !std::isnan(ap) && bp > 0 && ap > 0) {
            spread = ap - bp;
            spreadPercent = (spread / bp) * 100.0;
        }

        // 1. Calculate Volatility level
        std::string volatilityLevel = "LOW";
        double stdev = std::nan("");
        double mean = std::nan("");
        
        if (priceHistories[sym].size() >= 5) {
            const auto& prices = priceHistories[sym];
            double sum = std::accumulate(prices.begin(), prices.end(), 0.0);
            mean = sum / prices.size();
            
            double sq_sum = 0.0;
            for (double p : prices) {
                sq_sum += (p - mean) * (p - mean);
            }
            double variance = sq_sum / prices.size();
            stdev = std::sqrt(variance);

            if (mean > 0) {
                double cv = stdev / mean;
                // Boundaries adjusted for 15s polling frequency
                if (cv >= 0.005) { // 0.5%
                    volatilityLevel = "HIGH";
                } else if (cv >= 0.001) { // 0.1%
                    volatilityLevel = "MEDIUM";
                } else {
                    volatilityLevel = "LOW";
                }
            }
        }

        // 2. Calculate Volume Signal & Institutional Activity
        std::string volumeSignal = "Normal";
        std::string institutionalAlert = "NONE";
        if (volumeHistories[sym].size() >= 5 && !std::isnan(volume) && volume > 0) {
            const auto& vols = volumeHistories[sym];
            double sum = std::accumulate(vols.begin(), vols.end() - 1, 0.0);
            double meanVol = sum / (vols.size() - 1);
            if (meanVol > 0) {
                if (volume >= 5.0 * meanVol) {
                    volumeSignal = "High";
                    institutionalAlert = "HIGH";
                } else if (volume >= 3.0 * meanVol) {
                    volumeSignal = "High";
                    institutionalAlert = "MEDIUM";
                } else if (volume >= 1.5 * meanVol) {
                    volumeSignal = "High";
                    institutionalAlert = "LOW";
                }
            }
        }

        // Store spread history and check compression
        if (!std::isnan(spreadPercent) && spreadPercent > 0) {
            spreadHistories[sym].push_back(spreadPercent);
            if (spreadHistories[sym].size() > WINDOW_SIZE) {
                spreadHistories[sym].erase(spreadHistories[sym].begin());
            }
            if (spreadHistories[sym].size() >= 5) {
                const auto& spreads = spreadHistories[sym];
                double sumSpread = std::accumulate(spreads.begin(), spreads.end() - 1, 0.0);
                double meanSpread = sumSpread / (spreads.size() - 1);
                if (meanSpread > 0 && spreadPercent < 0.5 * meanSpread) {
                    if (institutionalAlert == "NONE" || institutionalAlert == "LOW") {
                        institutionalAlert = "MEDIUM";
                    }
                }
            }
        }

        // 3. Compute Liquidity Score & Rating
        double liquidityScore = 0.0;
        bool quotesAvailable = !std::isnan(bp) && !std::isnan(ap) && !std::isnan(bs) && !std::isnan(as);

        if (quotesAvailable) {
            // High-fidelity quote-based score
            double spreadPenalty = std::exp(-spreadPercent / 0.1); // Quick decay for spreads > 0.1%
            
            // Adjust depth size calculation based on Asset Type (shares vs crypto coins)
            double depth = bs + as;
            double depthUSD = depth;
            if (assetType == "crypto" && !std::isnan(lastPrice)) {
                depthUSD = depth * lastPrice;
            }
            
            // Score from depth (scale factor: $50,000 depth represents score ~63)
            double depthScore = 1.0 - std::exp(-depthUSD / 50000.0);
            
            liquidityScore = (0.7 * spreadPenalty + 0.3 * depthScore) * 100.0;
        } else {
            // Fallback: price movement and volume only
            double volumeUSD = volume;
            if (assetType == "crypto" && !std::isnan(lastPrice) && !std::isnan(volume)) {
                volumeUSD = volume * lastPrice;
            }
            
            // Volume component (scale factor: $100,000 volume represents score ~63)
            double volumeScore = 1.0 - std::exp(-volumeUSD / 100000.0);
            
            // Volatility penalty component
            double volPenalty = 1.0;
            if (volatilityLevel == "HIGH") {
                volPenalty = 0.4;
            } else if (volatilityLevel == "MEDIUM") {
                volPenalty = 0.7;
            }
            
            liquidityScore = volumeScore * volPenalty * 100.0;
        }

        // Clamp liquidity score
        if (liquidityScore < 0.0) liquidityScore = 0.0;
        if (liquidityScore > 100.0) liquidityScore = 100.0;

        // Map rating
        std::string liquidityRating = "Poor";
        if (liquidityScore >= 90.0) liquidityRating = "Excellent";
        else if (liquidityScore >= 70.0) liquidityRating = "Good";
        else if (liquidityScore >= 50.0) liquidityRating = "Moderate";
        else liquidityRating = "Poor";

        // 4. Compute Market Health Score
        double volMultiplier = 1.0;
        if (volatilityLevel == "HIGH") volMultiplier = 0.4;
        else if (volatilityLevel == "MEDIUM") volMultiplier = 0.75;
        
        double marketHealthScore = liquidityScore * volMultiplier;
        if (!std::isnan(spreadPercent) && spreadPercent > 0.5) {
            marketHealthScore *= (1.0 - std::min(spreadPercent / 2.0, 0.5));
        }

        if (marketHealthScore < 0.0) marketHealthScore = 0.0;
        if (marketHealthScore > 100.0) marketHealthScore = 100.0;

        // 5. Compute Risk Score Component
        double liquidityRisk = 100.0 - liquidityScore;
        double volatilityRisk = 15.0; // Baseline
        if (priceHistories[sym].size() >= 5 && !std::isnan(stdev) && !std::isnan(mean) && mean > 0) {
            double cv = stdev / mean;
            volatilityRisk = cv * 10000.0;
        }
        if (volatilityRisk < 0.0) volatilityRisk = 0.0;
        if (volatilityRisk > 100.0) volatilityRisk = 100.0;

        double spreadRisk = 10.0; // Baseline
        if (!std::isnan(spreadPercent)) {
            spreadRisk = spreadPercent * 200.0;
        }
        if (spreadRisk < 0.0) spreadRisk = 0.0;
        if (spreadRisk > 100.0) spreadRisk = 100.0;

        double overallRiskScore = 0.4 * liquidityRisk + 0.4 * volatilityRisk + 0.2 * spreadRisk;
        if (overallRiskScore < 0.0) overallRiskScore = 0.0;
        if (overallRiskScore > 100.0) overallRiskScore = 100.0;

        // 6. Handle Daily Change Percentage Pass-through & Fallback
        double dailyChangePercent = getDoubleField(line, "dailyChangePercent");
        if (std::isnan(dailyChangePercent)) {
            if (sessionOpenPrices.find(sym) == sessionOpenPrices.end() && !std::isnan(lastPrice) && lastPrice > 0) {
                sessionOpenPrices[sym] = lastPrice;
            }
            if (sessionOpenPrices.find(sym) != sessionOpenPrices.end() && sessionOpenPrices[sym] > 0 && !std::isnan(lastPrice)) {
                dailyChangePercent = ((lastPrice - sessionOpenPrices[sym]) / sessionOpenPrices[sym]) * 100.0;
            } else {
                dailyChangePercent = 0.0;
            }
        }

        // Print output JSON line
        std::cout << "{";
        std::cout << "\"symbol\":\"" << sym << "\",";
        std::cout << "\"assetType\":\"" << assetType << "\",";
        
        if (std::isnan(lastPrice)) std::cout << "\"lastPrice\":null,";
        else std::cout << "\"lastPrice\":" << lastPrice << ",";

        if (std::isnan(volume)) std::cout << "\"volume\":null,";
        else std::cout << "\"volume\":" << volume << ",";

        if (std::isnan(bp)) std::cout << "\"bidPrice\":null,";
        else std::cout << "\"bidPrice\":" << bp << ",";

        if (std::isnan(bs)) std::cout << "\"bidSize\":null,";
        else std::cout << "\"bidSize\":" << bs << ",";

        if (std::isnan(ap)) std::cout << "\"askPrice\":null,";
        else std::cout << "\"askPrice\":" << ap << ",";

        if (std::isnan(as)) std::cout << "\"askSize\":null,";
        else std::cout << "\"askSize\":" << as << ",";

        if (std::isnan(spread)) std::cout << "\"spread\":null,";
        else std::cout << "\"spread\":" << spread << ",";

        if (std::isnan(spreadPercent)) std::cout << "\"spreadPercent\":null,";
        else std::cout << "\"spreadPercent\":" << spreadPercent << ",";

        std::cout << "\"liquidityScore\":" << liquidityScore << ",";
        std::cout << "\"liquidityRating\":\"" << liquidityRating << "\",";
        std::cout << "\"volumeSignal\":\"" << volumeSignal << "\",";
        std::cout << "\"volatilityLevel\":\"" << volatilityLevel << "\",";
        std::cout << "\"marketHealthScore\":" << marketHealthScore << ",";

        if (std::isnan(stdev)) std::cout << "\"stdev\":null,";
        else std::cout << "\"stdev\":" << stdev << ",";

        std::cout << "\"liquidityRisk\":" << liquidityRisk << ",";
        std::cout << "\"volatilityRisk\":" << volatilityRisk << ",";
        std::cout << "\"spreadRisk\":" << spreadRisk << ",";
        std::cout << "\"overallRiskScore\":" << overallRiskScore << ",";
        std::cout << "\"institutionalAlert\":\"" << institutionalAlert << "\",";
        std::cout << "\"dailyChangePercent\":" << dailyChangePercent << ",";

        std::cout << "\"timestamp\":" << t;
        std::cout << "}" << std::endl;
    }

    return 0;
}
