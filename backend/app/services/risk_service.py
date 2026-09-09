from datetime import datetime


def detect_risks(project, updates):

    risks = []

    if not updates:
        return {
            "overall_risk": "UNKNOWN",
            "number_of_risks": 0,
            "risks": []
        }

    latest_update = updates[-1]

    # -----------------------------------
    # 1. Check for stale progress updates
    # -----------------------------------

    days_since_update = (
        datetime.now() - latest_update.update_date
    ).days

    if days_since_update > 90:

        risks.append({
            "type": "STALE_DATA",
            "severity": "MEDIUM",
            "message": (
                f"No progress update has been submitted "
                f"for {days_since_update} days."
            )
        })

    # -----------------------------------
    # 2. Check for sudden progress jumps
    # -----------------------------------

    for i in range(1, len(updates)):

        previous = updates[i - 1]
        current = updates[i]

        progress_jump = (
            current.progress_value
            - previous.progress_value
        )

        jump_percentage = (
            progress_jump / project.target_value
        ) * 100

        if jump_percentage >= 25:

            risks.append({
                "type": "SUDDEN_PROGRESS_JUMP",
                "severity": "HIGH",
                "message": (
                    f"Progress increased by "
                    f"{round(jump_percentage, 2)}% "
                    f"between "
                    f"{previous.update_date.date()} and "
                    f"{current.update_date.date()}."
                )
            })

    # -----------------------------------
    # 3. Check for progress decrease
    # -----------------------------------

    for i in range(1, len(updates)):

        previous = updates[i - 1]
        current = updates[i]

        if current.progress_value < previous.progress_value:

            risks.append({
                "type": "PROGRESS_DECREASE",
                "severity": "HIGH",
                "message": (
                    "Reported cumulative progress decreased "
                    "compared to the previous update."
                )
            })

    # -----------------------------------
    # Determine overall risk level
    # -----------------------------------

    if any(
        risk["severity"] == "HIGH"
        for risk in risks
    ):
        overall_risk = "HIGH"

    elif any(
        risk["severity"] == "MEDIUM"
        for risk in risks
    ):
        overall_risk = "MEDIUM"

    else:
        overall_risk = "LOW"

    return {
        "overall_risk": overall_risk,
        "number_of_risks": len(risks),
        "risks": risks
    }
