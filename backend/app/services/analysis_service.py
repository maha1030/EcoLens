from datetime import datetime


def calculate_progress_analysis(
    project,
    latest_update
):

    total_duration = (
        project.end_date - project.start_date
    ).total_seconds()

    if total_duration <= 0:
        raise ValueError("Invalid project timeline")

    elapsed_duration = (
        datetime.now() - project.start_date
    ).total_seconds()

    expected_percentage = (
        elapsed_duration / total_duration
    ) * 100

    expected_percentage = max(
        0,
        min(expected_percentage, 100)
    )

    actual_percentage = (
        latest_update.progress_value
        / project.target_value
    ) * 100

    actual_percentage = max(
        0,
        min(actual_percentage, 100)
    )

    progress_gap = (
        actual_percentage - expected_percentage
    )

    if progress_gap >= -5:
        status = "ON TRACK"

    elif progress_gap >= -20:
        status = "AT RISK"

    else:
        status = "BEHIND"

    return {
        "expected_progress_percentage": round(
            expected_percentage, 2
        ),
        "actual_progress_percentage": round(
            actual_percentage, 2
        ),
        "progress_gap_percentage": round(
            progress_gap, 2
        ),
        "status": status
    }
