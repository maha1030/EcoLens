from app.services.analysis_service import (
    calculate_progress_analysis
)

from app.services.risk_service import (
    detect_risks
)

from app.services.prediction_service import (
    predict_project_outcome
)


def calculate_ecopromise_score(project, updates):

    if len(updates) < 2:
        raise ValueError(
            "At least 2 progress updates are required to calculate the EcoPromise Score"
        )

    latest_update = updates[-1]

    # =========================================
    # GET RESULTS FROM EXISTING SERVICES
    # =========================================

    analysis = calculate_progress_analysis(
        project,
        latest_update
    )

    risk_result = detect_risks(
        project,
        updates
    )

    prediction = predict_project_outcome(
        project,
        updates
    )

    # =========================================
    # 1. PROGRESS SCORE — 50 POINTS
    # =========================================

    progress_gap = analysis["progress_gap_percentage"]

    if progress_gap >= 0:
        progress_score = 50

    elif progress_gap >= -10:
        progress_score = 40

    elif progress_gap >= -25:
        progress_score = 25

    else:
        progress_score = 10

    # =========================================
    # 2. RISK SCORE — 25 POINTS
    # =========================================

    overall_risk = risk_result["overall_risk"]

    if overall_risk == "LOW":
        risk_score = 25

    elif overall_risk == "MEDIUM":
        risk_score = 15

    else:
        risk_score = 5

    # =========================================
    # 3. PREDICTION SCORE — 25 POINTS
    # =========================================

    predicted_percentage = (
        prediction["predicted_completion_percentage"]
    )

    if predicted_percentage >= 95:
        prediction_score = 25

    elif predicted_percentage >= 70:
        prediction_score = 15

    else:
        prediction_score = 5

    # =========================================
    # FINAL SCORE
    # =========================================

    ecopromise_score = (
        progress_score
        + risk_score
        + prediction_score
    )

    # =========================================
    # FINAL RATING
    # =========================================

    if ecopromise_score >= 80:
        rating = "TRUSTWORTHY"

    elif ecopromise_score >= 60:
        rating = "MODERATE RISK"

    else:
        rating = "HIGH RISK"

    return {
        "progress_score": progress_score,
        "risk_score": risk_score,
        "prediction_score": prediction_score,

        "ecopromise_score": ecopromise_score,

        "rating": rating,

        # Optional detailed information
        "analysis": analysis,
        "risk_details": risk_result,
        "prediction": prediction
    }