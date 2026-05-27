from pathlib import Path
import re
from typing import Optional

import pandas as pd
import plotly.express as px
import streamlit as st


st.set_page_config(
    page_title="Philippines Online Scam Harm Dashboard",
    page_icon="📊",
    layout="wide",
)


DATA_CANDIDATES = [
    Path("/Users/vaay/Downloads/Datasets"),
    Path(__file__).resolve().parent / "Datasets",
    Path(__file__).resolve().parent,
]

SCAM_COLORS = {
    "Online Selling": "#8b1e3f",
    "Investment/Tasking": "#9a6700",
    "Vishing": "#0f4c81",
    "Hijacked Profile/ID": "#4b5563",
    "Loan/Lending Scam": "#334155",
    "Travel Scam": "#6b7280",
}

ASTERISK_TYPES = {"Hijacked Profile/ID", "Loan/Lending Scam", "Travel Scam"}


def find_data_file(filename: str) -> Path:
    for base in DATA_CANDIDATES:
        candidate = base / filename
        if candidate.exists():
            return candidate
    searched = ", ".join(str(path) for path in DATA_CANDIDATES)
    raise FileNotFoundError(f"Could not find {filename}. Searched: {searched}")


@st.cache_data
def load_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    fhi = pd.read_csv(find_data_file("fhi_ranking.csv"))
    master = pd.read_csv(find_data_file("master_dataset.csv"))
    platform = pd.read_csv(find_data_file("platform_losses.csv"))
    demographics = pd.read_csv(find_data_file("demographic_findings.csv"))
    return fhi, master, platform, demographics


def add_rank_labels(fhi_df: pd.DataFrame) -> pd.DataFrame:
    labeled = fhi_df.copy()
    labeled["display_type"] = labeled["scam_type"].apply(
        lambda name: f"{name}*" if name in ASTERISK_TYPES else name
    )
    labeled["rank_label"] = labeled.apply(
        lambda row: f"#{int(row['rank'])} {row['display_type']}", axis=1
    )
    labeled["color"] = labeled["scam_type"].map(SCAM_COLORS).fillna("#64748b")
    return labeled.sort_values("avg_fhi", ascending=True)


def first_matching_finding(df: pd.DataFrame, category: str, segment: str) -> str:
    match = df[(df["category"] == category) & (df["segment"] == segment)]
    if match.empty:
        return "No finding available."
    return match.iloc[0]["finding"]


def extract_first_number(text: str) -> Optional[float]:
    match = re.search(r"([\d,]+(?:\.\d+)?)", text.replace("₱", ""))
    if not match:
        return None
    return float(match.group(1).replace(",", ""))


def render_kpi_card(label: str, value: str, note: str, accent: str) -> None:
    st.markdown(
        f"""
        <div style="
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            border-left: 6px solid {accent};
            border-radius: 14px;
            padding: 18px 18px 14px 18px;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
            min-height: 128px;
        ">
            <div style="font-size: 0.82rem; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; font-weight: 700;">{label}</div>
            <div style="font-size: 2rem; line-height: 1.1; color: #0f172a; font-weight: 800; margin-top: 12px;">{value}</div>
            <div style="font-size: 0.95rem; color: #475569; margin-top: 10px;">{note}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


fhi_df, master_df, platform_df, demographic_df = load_data()

ranked_fhi = add_rank_labels(fhi_df)
top_scam = fhi_df.sort_values("rank").iloc[0]
runner_up = fhi_df.sort_values("rank").iloc[1]
top_platform = platform_df.sort_values("total_loss_php", ascending=False).iloc[0]
all_scams = fhi_df.sort_values("rank")["scam_type"].tolist()
all_years = sorted(master_df["year"].unique().tolist())

suburban_finding = first_matching_finding(
    demographic_df, "Location", "Suburban residents"
)
millennial_finding = first_matching_finding(
    demographic_df, "Age Group", "Millennials"
)
genx_finding = first_matching_finding(demographic_df, "Age Group", "Gen X")
silent_finding = first_matching_finding(demographic_df, "Age Group", "Silent Generation")
genz_finding = first_matching_finding(demographic_df, "Age Group", "Gen Z")

age_loss_df = pd.DataFrame(
    [
        {"segment": "Millennials", "value": extract_first_number(millennial_finding), "metric": "Average Loss (PHP)"},
        {"segment": "Gen X", "value": extract_first_number(genx_finding), "metric": "Average Loss (PHP)"},
    ]
).dropna()

risk_snapshot_df = pd.DataFrame(
    [
        {"segment": "Suburban Residents", "value": extract_first_number(suburban_finding), "metric": "Scam Exposure %"},
        {"segment": "Silent Generation", "value": extract_first_number(silent_finding), "metric": "Scam Experience %"},
        {"segment": "Gen Z", "value": extract_first_number(genz_finding), "metric": "Low Confidence %"},
    ]
).dropna()

st.markdown(
    """
    <style>
    .stApp {
    background:
        linear-gradient(135deg, rgba(15, 76, 129, 0.10), rgba(139, 30, 63, 0.10) 40%, rgba(154, 103, 0, 0.10) 100%),
        linear-gradient(180deg, #cbd5e1 0px, #f8fafc 420px, #f8fafc 100%);
    }
    [data-testid="stSidebar"] {
    background: #dbe4ee;
    }
    div[data-testid="stPlotlyChart"] {
    background: rgba(255, 255, 255, 0.98);
    border-radius: 16px;
    padding: 8px 8px 2px 8px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.10);
    border: 1px solid rgba(148, 163, 184, 0.28);
    }
    h1, h2, h3, [data-testid="stMetricLabel"], [data-testid="stCaptionContainer"] {
    color: #0f172a;
    }
    p, label, .stMarkdown, .stText {
    color: #1e293b;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title(
    "Which online scam type in the Philippines caused the greatest financial harm from 2023–2025, and which sector of society is most victimized?"
)
st.caption(
    "Chart-first answer view: Online Selling ranks first by Financial Harm Index, while suburban residents show the highest exposure and millennials show the highest average loss."
)

with st.sidebar:
    st.header("Explore")
    focus_scam = st.selectbox(
        "Focus scam type",
        all_scams,
        index=0,
        key="focus_scam",
    )
    selected_year = st.selectbox(
        "Focus year",
        all_years,
        index=len(all_years) - 1,
        key="focus_year",
    )
    trend_mode = st.radio(
        "Trend chart type",
        ["Grouped bars", "Line"],
        index=0,
        key="trend_mode",
    )
    selected_years = st.multiselect(
        "Years for trend view",
        all_years,
        default=all_years,
        key="years_filter",
    )
    selected_scams = st.multiselect(
        "Scam types for trend view",
        master_df["scam_type"].drop_duplicates().tolist(),
        default=master_df["scam_type"].drop_duplicates().tolist(),
        key="scam_filter",
    )
    show_table = st.toggle(
        "Show ranking table",
        value=False,
        key="show_ranking_table",
    )

focus_record = fhi_df.loc[fhi_df["scam_type"] == focus_scam].iloc[0]
focus_year_record = master_df[
    (master_df["scam_type"] == focus_scam) & (master_df["year"] == selected_year)
]
focus_year_record = focus_year_record.iloc[0] if not focus_year_record.empty else None
ranked_fhi["is_focus"] = ranked_fhi["scam_type"].eq(focus_scam)
highlight_colors = {
    scam: ("#8b1e3f" if scam == focus_scam else "#94a3b8") for scam in ranked_fhi["scam_type"]
}

kpi_1, kpi_2, kpi_3, kpi_4 = st.columns(4)
with kpi_1:
    render_kpi_card(
        "Highest Harm Scam",
        top_scam["scam_type"],
        f"Average FHI of {top_scam['avg_fhi']:,.0f}",
        "#8b1e3f",
    )
with kpi_2:
    render_kpi_card(
        "Focus Scam",
        focus_scam,
        f"Rank #{int(focus_record['rank'])} across the 2024–2025 FHI list",
        "#0f4c81",
    )
with kpi_3:
    render_kpi_card(
        "Top Platform Loss",
        f"₱{top_platform['total_loss_php'] / 1_000_000:,.2f}M",
        f"{top_platform['platform']} users reported the highest 2024 losses",
        "#9a6700",
    )
with kpi_4:
    render_kpi_card(
        "Most Victimized Sectors",
        "Suburban + Millennials",
        "Highest exposure by location and highest average loss by age",
        "#0f4c81",
    )

lead_col, trend_top_col = st.columns([1.6, 1.15])

with lead_col:
    fhi_fig = px.bar(
        ranked_fhi,
        x="avg_fhi",
        y="rank_label",
        orientation="h",
        text="avg_fhi",
        color="scam_type",
        color_discrete_map=highlight_colors,
    )
    fhi_fig.update_traces(
        texttemplate="%{text:,.0f}",
        textposition="outside",
        hovertemplate="<b>%{customdata[0]}</b><br>Years present: %{customdata[1]}<br>Total cases: %{customdata[2]:,}<br>Average FHI: %{x:,.2f}<extra></extra>",
        customdata=ranked_fhi[["scam_type", "years_present", "total_cases"]].to_numpy(),
        marker_line_width=0,
    )
    fhi_fig.update_layout(
        height=455,
        margin=dict(l=10, r=20, t=20, b=20),
        xaxis_title="Average Financial Harm Index (FHI)",
        yaxis_title="",
        showlegend=False,
        font=dict(color="#0f172a"),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    st.subheader("FHI Ranking: Scam Types by Financial Harm")
    st.plotly_chart(fhi_fig, use_container_width=True, key="fhi_chart")
    st.caption(
        "* Appears in only one year of the 2024–2025 scam-type dataset, so the score is not a two-year average."
    )

with trend_top_col:
    st.subheader("Scam Cases Over Time")
    top_trend_df = master_df[
        master_df["year"].isin(selected_years) & master_df["scam_type"].isin(selected_scams)
    ]
    if trend_mode == "Grouped bars":
        landing_trend_fig = px.bar(
            top_trend_df.sort_values(["year", "case_count"], ascending=[True, False]),
            x="year",
            y="case_count",
            color="scam_type",
            barmode="group",
            color_discrete_map=SCAM_COLORS,
            hover_data={
                "scam_type": True,
                "case_count": ":,",
                "total_loss_php_est": ":,.2f",
                "fhi_score": ":,.2f",
                "year": True,
            },
        )
    else:
        landing_trend_fig = px.line(
            top_trend_df.sort_values(["scam_type", "year"]),
            x="year",
            y="case_count",
            color="scam_type",
            markers=True,
            color_discrete_map=SCAM_COLORS,
            hover_data={
                "scam_type": True,
                "case_count": ":,",
                "total_loss_php_est": ":,.2f",
                "fhi_score": ":,.2f",
                "year": True,
            },
        )
    landing_trend_fig.update_layout(
        height=455,
        margin=dict(l=10, r=10, t=20, b=20),
        xaxis_title="Year",
        yaxis_title="Reported Cases",
        legend_title="Scam Type",
        font=dict(color="#0f172a"),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(landing_trend_fig, use_container_width=True, key="landing_trend_chart")

st.caption(
    "Analytical method: Financial Harm Index (FHI) = average loss per victim × prevalence weight. Scope: 2024–2025 scam-type data; 2023 is baseline only."
)

if show_table:
    table_df = fhi_df.copy()
    table_df["scam_type"] = table_df["scam_type"].apply(
        lambda name: f"{name}*" if name in ASTERISK_TYPES else name
    )
    table_df = table_df.rename(
        columns={
            "scam_type": "Scam Type",
            "avg_fhi": "Average FHI",
            "total_cases": "Total Cases",
            "years_present": "Years Present",
            "rank": "Rank",
        }
    )
    st.dataframe(
        table_df[["Rank", "Scam Type", "Average FHI", "Total Cases", "Years Present"]],
        use_container_width=True,
        hide_index=True,
    )

filtered_master = master_df[
    master_df["year"].isin(selected_years) & master_df["scam_type"].isin(selected_scams)
]

row_two_left, row_two_mid, row_two_right = st.columns([1, 1, 1.05])

with row_two_left:
    st.subheader("Cases vs Harm by Year")
    compare_df = master_df[master_df["year"] == selected_year].copy()
    compare_df["focus_size"] = compare_df["scam_type"].apply(
        lambda value: 26 if value == focus_scam else 16
    )
    compare_fig = px.scatter(
        compare_df,
        x="case_count",
        y="fhi_score",
        size="focus_size",
        color="scam_type",
        color_discrete_map=SCAM_COLORS,
        hover_name="scam_type",
        hover_data={
            "case_count": ":,",
            "fhi_score": ":,.2f",
            "total_loss_php_est": ":,.2f",
            "focus_size": False,
        },
    )
    compare_fig.update_layout(
        height=380,
        margin=dict(l=10, r=10, t=20, b=20),
        xaxis_title=f"Reported Cases in {selected_year}",
        yaxis_title=f"FHI Score in {selected_year}",
        showlegend=False,
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(compare_fig, use_container_width=True, key="compare_chart")

with row_two_mid:
    st.subheader("Platform Losses in 2024")
    platform_fig = px.bar(
        platform_df.sort_values("total_loss_php"),
        x="total_loss_php",
        y="platform",
        orientation="h",
        text="total_loss_php",
        color="platform",
        color_discrete_sequence=["#0f4c81", "#8b1e3f", "#9a6700", "#475569"],
    )
    platform_fig.update_traces(
        texttemplate="₱%{text:,.0f}",
        textposition="outside",
        marker_line_width=0,
    )
    platform_fig.update_layout(
        height=380,
        margin=dict(l=10, r=20, t=20, b=20),
        xaxis_title="Total Loss (PHP)",
        yaxis_title="",
        showlegend=False,
        font=dict(color="#0f172a"),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(platform_fig, use_container_width=True, key="platform_chart")

with row_two_right:
    st.subheader(f"{selected_year} Scam Mix")
    mix_fig = px.pie(
        master_df[master_df["year"] == selected_year],
        names="scam_type",
        values="case_count",
        color="scam_type",
        color_discrete_map=SCAM_COLORS,
        hole=0.45,
    )
    mix_fig.update_traces(textposition="inside", textinfo="percent")
    mix_fig.update_layout(
        height=380,
        margin=dict(l=10, r=10, t=20, b=20),
        showlegend=True,
        legend_title="Scam Type",
        font=dict(color="#0f172a"),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(mix_fig, use_container_width=True, key="mix_chart")

row_three_left, row_three_mid, row_three_right = st.columns([1, 1, 1.05])

with row_three_left:
    st.subheader("Victimized Sectors")
    victim_fig = px.bar(
        risk_snapshot_df.sort_values("value"),
        x="value",
        y="segment",
        orientation="h",
        text="value",
        color="segment",
        color_discrete_sequence=["#8b1e3f", "#9a6700", "#0f4c81"],
    )
    victim_fig.update_traces(
        texttemplate="%{text:.0f}%",
        textposition="outside",
        marker_line_width=0,
    )
    victim_fig.update_layout(
        height=305,
        margin=dict(l=10, r=20, t=20, b=10),
        xaxis_title="Share (%)",
        yaxis_title="",
        showlegend=False,
        font=dict(color="#0f172a"),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(victim_fig, use_container_width=True, key="victim_chart")

with row_three_mid:
    st.subheader("Average Loss by Age Group")
    age_loss_fig = px.bar(
        age_loss_df.sort_values("value"),
        x="segment",
        y="value",
        text="value",
        color="segment",
        color_discrete_sequence=["#475569", "#8b1e3f"],
    )
    age_loss_fig.update_traces(
        texttemplate="₱%{text:,.0f}",
        textposition="outside",
        marker_line_width=0,
    )
    age_loss_fig.update_layout(
        height=305,
        margin=dict(l=10, r=10, t=20, b=10),
        xaxis_title="",
        yaxis_title="Average Loss (PHP)",
        showlegend=False,
        font=dict(color="#0f172a"),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(age_loss_fig, use_container_width=True, key="age_loss_chart")

with row_three_right:
    st.subheader(f"{focus_scam} Year Detail")
    detail_df = master_df[master_df["scam_type"] == focus_scam].copy()
    detail_fig = px.line(
        detail_df.sort_values("year"),
        x="year",
        y="fhi_score",
        markers=True,
        color_discrete_sequence=["#8b1e3f"],
    )
    detail_fig.update_traces(
        line_width=4,
        marker_size=12,
        hovertemplate="Year %{x}<br>FHI %{y:,.2f}<extra></extra>",
    )
    detail_fig.update_layout(
        height=305,
        margin=dict(l=10, r=10, t=20, b=10),
        xaxis_title="Year",
        yaxis_title="FHI Score",
        showlegend=False,
        font=dict(color="#0f172a"),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(detail_fig, use_container_width=True, key="detail_chart")

with st.expander("View full demographic findings", expanded=False):
    st.dataframe(demographic_df, use_container_width=True, hide_index=True)

st.divider()
st.markdown(
    f"""
    **Recommendation:** Prioritize anti-fraud interventions against `Online Selling` scams first, then `Investment/Tasking`, while tailoring victim protection toward suburban communities and millennial users.

    **Analytical method:** Financial Harm Index (FHI), adapted from Voce & Morgan, AIC (2025), *Developing a harm index for individual victims of cybercrime*. This dashboard uses 2024–2025 scam-type data for the index and 2024 platform/demographic evidence for support.

    **Data files used:** `{find_data_file("fhi_ranking.csv")}`, `{find_data_file("master_dataset.csv")}`, `{find_data_file("platform_losses.csv")}`, `{find_data_file("demographic_findings.csv")}`
    """
)
