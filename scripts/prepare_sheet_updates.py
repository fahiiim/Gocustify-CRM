import json
import openpyxl

wb = openpyxl.load_workbook("Mabdel_Backend_Features_Frontend_Testing_Guide_Updated.xlsx", data_only=True)
ws_features = wb["Backend Features & UI Testing"]
ws_overview = wb["Executive Overview"]

# 1. Verification status for existing features (J4:J96)
statuses_data = []
for r in range(4, 97):
    val = ws_features.cell(row=r, column=10).value
    statuses_data.append([val])

# 2. New features (A97:J114)
new_features_data = []
for r in range(97, ws_features.max_row + 1):
    row_vals = [str(ws_features.cell(row=r, column=c).value or "") for c in range(1, 11)]
    new_features_data.append(row_vals)

# 3. Executive Overview updates (E5:G21)
overview_e5_g21_data = []
for r in range(5, 22):
    row_vals = [
        ws_overview.cell(row=r, column=5).value,
        ws_overview.cell(row=r, column=6).value,
        ws_overview.cell(row=r, column=7).value,
    ]
    overview_e5_g21_data.append(row_vals)

# 4. Executive Overview new domains (A22:G25)
overview_new_domains_data = []
for r in range(22, 26):
    row_vals = [ws_overview.cell(row=r, column=c).value for c in range(1, 8)]
    overview_new_domains_data.append(row_vals)

# 5. Executive Overview summary block (A28:G30)
overview_summary_data = []
for r in range(28, 31):
    row_vals = [ws_overview.cell(row=r, column=c).value or "" for c in range(1, 8)]
    overview_summary_data.append(row_vals)

batch_requests = [
    {
        "op": "write",
        "range": "'Backend Features & UI Testing'!J4:J96",
        "data": statuses_data,
    },
    {
        "op": "write",
        "range": f"'Backend Features & UI Testing'!A97:J{96 + len(new_features_data)}",
        "data": new_features_data,
    },
    {
        "op": "write",
        "range": "'Executive Overview'!E5:G21",
        "data": overview_e5_g21_data,
    },
    {
        "op": "write",
        "range": "'Executive Overview'!A22:G25",
        "data": overview_new_domains_data,
    },
    {
        "op": "write",
        "range": "'Executive Overview'!A28:G30",
        "data": overview_summary_data,
    },
]

with open("scratch/batch_updates.json", "w", encoding="utf-8") as f:
    json.dump(batch_requests, f, indent=2)

print(f"Generated batch_updates.json with {len(batch_requests)} operations.")
print(f"  - J4:J96 statuses: {len(statuses_data)} rows")
print(f"  - A97:J114 new features: {len(new_features_data)} rows")
print(f"  - Executive Overview E5:G21: {len(overview_e5_g21_data)} rows")
print(f"  - Executive Overview new domains: {len(overview_new_domains_data)} rows")
print(f"  - Executive Overview summary: {len(overview_summary_data)} rows")
