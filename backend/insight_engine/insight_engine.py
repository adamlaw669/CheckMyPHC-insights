import pandas as pd
import numpy as np
import json
from pathlib import Path

# -----------------------------
# Load datasets
# -----------------------------
base_path = Path("../Data")
service_delivery = pd.read_csv(base_path / "service_delivery.csv")
infrastructure = pd.read_csv(base_path / "infrastructure.csv")
inclusivity = pd.read_csv(base_path / "inclusivity.csv")

# -----------------------------
# 1. RESOURCE SHORTAGE DETECTION
# -----------------------------
shortage_cols = [
    'Identify Shortages of Medical Supplies(Syringes)?',
    'Identify Shortages of Medical Supplies(Bandages)?',
    'Identify Shortages of Medical Supplies(Personal Protective Equipment)?'
]

service_delivery["shortage_score"] = service_delivery[shortage_cols].apply(
    lambda x: sum(x.fillna("").str.lower().isin(["yes", "identified", "true"])), axis=1
)

service_delivery["alert_level"] = service_delivery["shortage_score"].apply(
    lambda x: "Low" if x == 0 else "Medium" if x <= 2 else "High"
)

# -----------------------------
# 2. SERVICE QUALITY SCORE
# -----------------------------
mapping = {
    "Very Poor": 1,
    "Poor": 2,
    "Fair": 3,
    "Good": 4,
    "Very Good": 5,
    "Excellent": 6
}

columns_to_convert = [
    "Rate the Quality of Treatment in this PHC",
    "Rate the Immunization Services Provided in the PHC",
    "Give a General Rating for the PHC"
]

for col in columns_to_convert:
    service_delivery[col] = service_delivery[col].map(mapping)

service_delivery["mean_service_score"] = service_delivery[columns_to_convert].mean(axis=1)
service_delivery["service_score_rank"] = service_delivery["mean_service_score"].rank(pct=True)

# Flag lowest 10% performers
service_delivery["low_quality_flag"] = np.where(service_delivery["service_score_rank"] <= 0.10, 1, 0)

# -----------------------------
# 3. INFRASTRUCTURE SCORING
# -----------------------------
infra_fail_cols = [
    "Check for any of these building failures./Broken Celling",
    "Check for any of these building failures./Damaged Chairs",
    "Check for any of these building failures./Damaged Door",
    "Check for any of these building failures./Damaged/Leaking roofs"
]

infrastructure["infra_failures"] = infrastructure[infra_fail_cols].apply(
    lambda x: sum(x.fillna("").str.lower().isin(["yes", "broken", "damaged", "true"])), axis=1
)

infrastructure["infra_score"] = 1 - (infrastructure["infra_failures"] / len(infra_fail_cols))
infrastructure["infra_score_norm"] = (infrastructure["infra_score"] - infrastructure["infra_score"].min()) / (
    infrastructure["infra_score"].max() - infrastructure["infra_score"].min()
)

# -----------------------------
# 4. INCLUSIVITY SCORING (FIXED)
# -----------------------------
col_name = "How Many Communities Rely on this PHC for Health Care"

# Force numeric conversion, strip text, and fill NaN with 0
inclusivity[col_name] = (
    inclusivity[col_name]
    .astype(str)
    .str.extract("(\d+)", expand=False)      # extract any digits
    .astype(float)
    .fillna(0)
)

inclusivity["communities_served_norm"] = (
    (inclusivity[col_name] - inclusivity[col_name].min()) /
    (inclusivity[col_name].max() - inclusivity[col_name].min())
)


# -----------------------------
# 5. COMBINE DATASETS (DEDUP FIXED)
# -----------------------------
def clean_phc_names(df):
    df["Name of Primary Health Center"] = (
        df["Name of Primary Health Center"].astype(str).str.strip().str.lower()
    )
    return df

service_delivery = clean_phc_names(service_delivery)
infrastructure = clean_phc_names(infrastructure)
inclusivity = clean_phc_names(inclusivity)

# Keep the first non-null LGA/State for reference
phc_meta = (
    service_delivery[["Name of Primary Health Center", "PHC LGA", "State of PHC"]]
    .drop_duplicates(subset="Name of Primary Health Center")
)

# Average numeric values
service_delivery_grp = service_delivery.groupby("Name of Primary Health Center", as_index=False).mean(numeric_only=True)
infrastructure_grp = infrastructure.groupby("Name of Primary Health Center", as_index=False).mean(numeric_only=True)
inclusivity_grp = inclusivity.groupby("Name of Primary Health Center", as_index=False).mean(numeric_only=True)

# Merge grouped frames
merged = (
    service_delivery_grp
    .merge(infrastructure_grp, on="Name of Primary Health Center", how="left")
    .merge(inclusivity_grp, on="Name of Primary Health Center", how="left")
    .merge(phc_meta, on="Name of Primary Health Center", how="left")
)

print(f"Merged dataset size after grouping: {merged.shape}")


# Normalize service score
merged["service_score_norm"] = (merged["mean_service_score"] - merged["mean_service_score"].min()) / (
    merged["mean_service_score"].max() - merged["mean_service_score"].min()
)

# -----------------------------
# 6. UNDERSERVED INDEX
# -----------------------------
merged["underserved_index"] = (
    0.5 * (1 - merged["infra_score_norm"].fillna(0)) +
    0.3 * (1 - merged["service_score_norm"].fillna(0)) +
    0.2 * merged["communities_served_norm"].fillna(0)
)

merged["underserved_rank"] = merged["underserved_index"].rank(ascending=False, pct=True)
merged["underserved_flag"] = np.where(merged["underserved_rank"] >= 0.90, 1, 0) # top 10% worst

# -----------------------------
# 7. RESOURCE FORECASTING (BONUS)
# -----------------------------
merged["referrals"] = service_delivery["How many Referrals to Larger Hospitals have occurred in the last 1 year"]
merged["referrals_norm"] = (merged["referrals"] - merged["referrals"].min()) / (
    merged["referrals"].max() - merged["referrals"].min()
)

merged["resource_risk_score"] = (
    0.6 * merged["shortage_score"].fillna(0) / 3 +
    0.4 * merged["referrals_norm"].fillna(0)
)

merged["resource_alert"] = merged["resource_risk_score"].apply(
    lambda x: "Low" if x < 0.3 else "Medium" if x < 0.6 else "High"
)

# -----------------------------
# 8. EXPORT RESULTS (FIXED)
# -----------------------------
out_dir = Path("../Outputs")
out_dir.mkdir(exist_ok=True)

# Resource shortage alerts
resource_alerts = merged[
    ["Name of Primary Health Center", "PHC LGA", "State of PHC", "shortage_score"]
].copy()
resource_alerts["alert_level"] = merged.get("alert_level", "Unknown")
resource_alerts.to_json(out_dir / "outbreak_alerts.json", orient="records", indent=2)

# Underserved PHCs
underserved = merged[
    ["Name of Primary Health Center", "PHC LGA", "State of PHC", "underserved_index", "underserved_flag"]
]
underserved.to_json(out_dir / "underserved_phcs.json", orient="records", indent=2)

# Resource warnings
resource_warnings = merged[
    ["Name of Primary Health Center", "PHC LGA", "State of PHC", "resource_risk_score", "resource_alert"]
]
resource_warnings.to_json(out_dir / "resource_warnings.json", orient="records", indent=2)

# Optional CSV summary for inspection
merged.to_csv(out_dir / "metrics_summary.csv", index=False)

print("Insight engine successfully generated JSON outputs.")