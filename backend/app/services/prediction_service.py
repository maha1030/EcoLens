def predict_project_outcome(project, updates):

    # Need at least 2 updates to calculate a trend
    if len(updates) < 2:
        raise ValueError(
            "At least 2 progress updates are required for prediction"
        )

    first_update = updates[0]
    latest_update = updates[-1]

    # Calculate progress gained
    progress_gained = (
        latest_update.progress_value
        - first_update.progress_value
    )

    # Calculate time passed
    days_passed = (
        latest_update.update_date
        - first_update.update_date
    ).days

    if days_passed <= 0:
        raise ValueError(
            "Invalid progress update dates"
        )

    # Average progress rate per day
    progress_per_day = (
        progress_gained / days_passed
    )

    # Remaining days until deadline
    days_remaining = (
        project.end_date
        - latest_update.update_date
    ).days

    # Don't allow negative remaining days
    days_remaining = max(days_remaining, 0)

    # Predict future progress
    predicted_final_progress = (
        latest_update.progress_value
        + (progress_per_day * days_remaining)
    )

    # Don't allow prediction above target
    predicted_final_progress = min(
        predicted_final_progress,
        project.target_value
    )

    # Calculate predicted completion percentage
    predicted_completion_percentage = (
        predicted_final_progress
        / project.target_value
    ) * 100

    # Determine outcome
    if predicted_completion_percentage >= 95:
        outcome = "LIKELY TO ACHIEVE TARGET"

    elif predicted_completion_percentage >= 70:
        outcome = "AT RISK"

    else:
        outcome = "UNLIKELY TO ACHIEVE TARGET"

    return {
        "current_progress": latest_update.progress_value,

        "average_progress_per_day": round(
            progress_per_day,
            4
        ),

        "predicted_final_progress": round(
            predicted_final_progress,
            2
        ),

        "predicted_completion_percentage": round(
            predicted_completion_percentage,
            2
        ),

        "outcome": outcome
    }