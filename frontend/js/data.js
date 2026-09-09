/* EcoLens AI - Seeded Mock Data
 *
 * All data in this file represents verified environmental pledge projects.
 * In production, this data is served by backend APIs (e.g. GET /api/v1/projects).
 *
 * - claimed: Number reported by the project organization.
 * - verified: Number confirmed after evidence verification (disputed updates contribute 0).
 * - confidence: Weighted 0-100 verification confidence score.
 * - checks: Detailed verification checks (relevance, duplicate, gps, plausibility).
 */
"use strict";

const EP_DATA = {
  demoDate: "2026-09-07",
  projects: [
    {
      id: "vanamitra",
      name: "Vanamitra Reforestation",
      org: "Vanamitra Foundation",
      kind: "nature",
      unit: "trees",
      target: 10000,
      durationMonths: 12,
      startDate: "2026-01-05",
      deadline: "2026-12-31",
      site: { name: "Lonavala ridge, Maharashtra", lat: 18.754, lng: 73.406 },
      displayLocation: "Madhya Pradesh, India",
      projectType: "Reforestation",
      timeline: "12 months (Deadline: 2026-12-31)",
      progressScore: 82,
      evidenceScore: 90,
      consistencyScore: 95,
      ecoLensScore: 82,
      riskLevel: "High",
      outcomePrediction: "At Risk",
      riskAnalysis: {
        currentRisk: "High",
        progressAnomaly: "Flagged (Month 7 irregular jump)",
        timelineRisk: "Elevated (Projected shortfall ~4,669 trees)",
        predictedOutcome: "At Risk (Deadline shortfall projected)"
      },
      evidenceAnalysis: {
        photoRelevance: "Verified (88% avg confidence)",
        duplicateDetection: "Flagged (Month 7 duplicate photo detected)",
        locationConsistency: "Consistent (0.11 km avg centroid offset)",
        evidenceConfidence: "90%"
      },
      gpsToleranceKm: 2,
      updates: [
        {
          month: 1,
          date: "2026-01-30",
          claimed: 480,
          verified: 480,
          photo: "assets/img/tree-01.jpg",
          lat: 18.7549,
          lng: 73.4071,
          confidence: 100,
          checks: {
            relevance: { status: "pass", short: "veg 24%", detail: "24% vegetation pixels, consistent with a field reforestation photo." },
            duplicate: { status: "na", short: "first photo", detail: "First photo of this project; establishing baseline hash." },
            gps: { status: "pass", short: "0.15 km", detail: "0.15 km from site centroid, well within 2.0 km tolerance." },
            plausibility: { status: "na", short: "no history", detail: "First reporting month; establishes growth rate baseline." }
          }
        },
        {
          month: 2,
          date: "2026-02-27",
          claimed: 520,
          verified: 520,
          photo: "assets/img/tree-02.jpg",
          lat: 18.7531,
          lng: 73.4048,
          confidence: 100,
          checks: {
            relevance: { status: "pass", short: "veg 50%", detail: "50% vegetation pixels, strong field evidence." },
            duplicate: { status: "pass", short: "hash 24/64", detail: "Closest earlier photo (month 1) is 24/64 away. No reuse detected." },
            gps: { status: "pass", short: "0.16 km", detail: "0.16 km from site centroid, within 2.0 km tolerance." },
            plausibility: { status: "pass", short: "z = 0.3", detail: "Increment of 520 fits the project baseline (z = 0.3)." }
          }
        },
        {
          month: 3,
          date: "2026-03-28",
          claimed: 510,
          verified: 510,
          photo: "assets/img/tree-03.jpg",
          lat: 18.7544,
          lng: 73.4055,
          confidence: 100,
          checks: {
            relevance: { status: "pass", short: "veg 15%", detail: "15% vegetation pixels, consistent with field nursery." },
            duplicate: { status: "pass", short: "hash 31/64", detail: "Closest earlier photo (month 2) is 31/64 away. No reuse detected." },
            gps: { status: "pass", short: "0.07 km", detail: "0.07 km from site centroid, within 2.0 km tolerance." },
            plausibility: { status: "pass", short: "z = 0.1", detail: "Increment of 510 matches normal progress trend (z = 0.1)." }
          }
        },
        {
          month: 4,
          date: "2026-04-26",
          claimed: 490,
          verified: 490,
          photo: "assets/img/tree-04.jpg",
          lat: 18.7538,
          lng: 73.4066,
          confidence: 100,
          checks: {
            relevance: { status: "pass", short: "veg 95%", detail: "95% vegetation pixels, excellent foliage density." },
            duplicate: { status: "pass", short: "hash 29/64", detail: "Closest earlier photo (month 1) is 29/64 away. Clean new evidence." },
            gps: { status: "pass", short: "0.07 km", detail: "0.07 km from site centroid, within 2.0 km tolerance." },
            plausibility: { status: "pass", short: "z = -0.2", detail: "Increment of 490 fits project history (z = -0.2)." }
          }
        },
        {
          month: 5,
          date: "2026-05-27",
          claimed: 500,
          verified: 500,
          photo: "assets/img/tree-05.jpg",
          lat: 18.7552,
          lng: 73.4059,
          confidence: 100,
          checks: {
            relevance: { status: "pass", short: "veg 17%", detail: "17% vegetation pixels, consistent with project site." },
            duplicate: { status: "pass", short: "hash 27/64", detail: "Closest earlier photo (month 3) is 27/64 away. No reuse detected." },
            gps: { status: "pass", short: "0.13 km", detail: "0.13 km from site centroid, within 2.0 km tolerance." },
            plausibility: { status: "pass", short: "z = 0.0", detail: "Increment of 500 matches expected monthly pace exactly." }
          }
        },
        {
          month: 6,
          date: "2026-06-26",
          claimed: 530,
          verified: 530,
          photo: "assets/img/tree-06.jpg",
          lat: 18.7536,
          lng: 73.4049,
          confidence: 100,
          checks: {
            relevance: { status: "pass", short: "veg 61%", detail: "61% vegetation pixels, strong monsoon planting progress." },
            duplicate: { status: "pass", short: "hash 33/64", detail: "Closest earlier photo is 33/64 away. Distinct new photo." },
            gps: { status: "pass", short: "0.12 km", detail: "0.12 km from site centroid, within 2.0 km tolerance." },
            plausibility: { status: "pass", short: "z = 0.5", detail: "Increment of 530 fits planting season trajectory (z = 0.5)." }
          }
        },
        {
          month: 7,
          date: "2026-07-28",
          claimed: 1800,
          verified: 0,
          photo: "assets/img/tree-03.jpg",
          lat: 18.7544,
          lng: 73.4055,
          confidence: 25,
          note: "Flagged: recycled photo from Month 3 and statistically implausible jump in planting claims.",
          checks: {
            relevance: { status: "pass", short: "veg 15%", detail: "15% vegetation pixels." },
            duplicate: { status: "fail", short: "hash 0/64", detail: "Hamming distance 0/64 to the photo of month 3. Exact duplicate photo recycled." },
            gps: { status: "pass", short: "0.07 km", detail: "0.07 km from site centroid, within tolerance." },
            plausibility: { status: "fail", short: "z = 4.3", detail: "Increment of 1,800 trees is 4.3 sigmas above project norm (modified z-score threshold: 3.5)." }
          }
        },
        {
          month: 8,
          date: "2026-08-27",
          claimed: 470,
          verified: 470,
          photo: "assets/img/tree-08.jpg",
          lat: 18.7541,
          lng: 73.4062,
          confidence: 100,
          checks: {
            relevance: { status: "pass", short: "veg 31%", detail: "31% vegetation pixels, healthy sapling field." },
            duplicate: { status: "pass", short: "hash 25/64", detail: "Closest earlier photo is 25/64 away. Genuine new photo." },
            gps: { status: "pass", short: "0.03 km", detail: "0.03 km from site centroid, within tolerance." },
            plausibility: { status: "pass", short: "z = -0.4", detail: "Increment of 470 returns to normal historical pace (z = -0.4)." }
          }
        },
        {
          month: 9,
          date: "2026-09-05",
          claimed: 500,
          verified: 500,
          photo: "assets/img/tree-09.jpg",
          lat: 18.7547,
          lng: 73.4052,
          confidence: 100,
          checks: {
            relevance: { status: "pass", short: "veg 36%", detail: "36% vegetation pixels, consistent field documentation." },
            duplicate: { status: "pass", short: "hash 30/64", detail: "Closest earlier photo is 30/64 away. No reuse detected." },
            gps: { status: "pass", short: "0.11 km", detail: "0.11 km from site centroid, within tolerance." },
            plausibility: { status: "pass", short: "z = 0.0", detail: "Increment of 500 fits historical norm (z = 0.0)." }
          }
        }
      ]
    },
    {
      id: "pichavaram",
      name: "Pichavaram Mangrove Restore",
      org: "Coastal Habitats Trust",
      kind: "nature",
      unit: "hectares",
      target: 100,
      durationMonths: 24,
      startDate: "2025-06-10",
      deadline: "2027-06-10",
      site: { name: "Pichavaram mangroves, Tamil Nadu", lat: 11.428, lng: 79.77 },
      displayLocation: "Tamil Nadu, India",
      projectType: "Mangrove Restoration",
      timeline: "24 months (Deadline: 2027-06-10)",
      progressScore: 92,
      evidenceScore: 95,
      consistencyScore: 97,
      ecoLensScore: 94,
      riskLevel: "Low",
      outcomePrediction: "On Track",
      riskAnalysis: {
        currentRisk: "Low",
        progressAnomaly: "Normal (Consistent monthly increments)",
        timelineRisk: "Low (Trajectory ahead of schedule)",
        predictedOutcome: "On Track (Projected to finish at ~108.1 ha)"
      },
      evidenceAnalysis: {
        photoRelevance: "Verified (96% avg confidence)",
        duplicateDetection: "No Duplicate (Unique hashes verified)",
        locationConsistency: "Consistent (0.08 km avg centroid offset)",
        evidenceConfidence: "95%"
      },
      gpsToleranceKm: 2,
      updates: [
        {
          month: 2,
          date: "2025-07-15",
          claimed: 7.5,
          verified: 7.5,
          photo: "assets/img/mangrove-01.jpg",
          lat: 11.4285,
          lng: 79.7706,
          confidence: 100,
          checks: {
            relevance: { status: "pass", short: "veg 15%", detail: "15% vegetation pixels, mangrove saplings verified." },
            duplicate: { status: "na", short: "first photo", detail: "First mangrove submission; initial photo hash recorded." },
            gps: { status: "pass", short: "0.08 km", detail: "0.08 km from site centroid, within 2.0 km tolerance." },
            plausibility: { status: "na", short: "no history", detail: "Initial baseline month." }
          }
        },
        {
          month: 4,
          date: "2025-09-12",
          claimed: 8.5,
          verified: 8.5,
          photo: "assets/img/mangrove-02.jpg",
          lat: 11.4274,
          lng: 79.7694,
          confidence: 100,
          checks: {
            relevance: { status: "pass", short: "veg 15%", detail: "15% vegetation pixels, consistent wetland habitat." },
            duplicate: { status: "pass", short: "hash 22/64", detail: "Closest earlier photo is 22/64 away. Unique evidence." },
            gps: { status: "pass", short: "0.09 km", detail: "0.09 km from site centroid, within 2.0 km tolerance." },
            plausibility: { status: "pass", short: "z = 0.2", detail: "Increment of 8.5 ha fits restoration plan." }
          }
        },
        {
          month: 6,
          date: "2025-11-14",
          claimed: 9.0,
          verified: 9.0,
          photo: "assets/img/mangrove-03.jpg",
          lat: 11.4288,
          lng: 79.7709,
          confidence: 100,
          checks: {
            relevance: { status: "pass", short: "veg 20%", detail: "20% vegetation pixels, verified tidal creek planting." },
            duplicate: { status: "pass", short: "hash 28/64", detail: "Closest earlier photo is 28/64 away. Clean new photo." },
            gps: { status: "pass", short: "0.13 km", detail: "0.13 km from site centroid, within tolerance." },
            plausibility: { status: "pass", short: "z = 0.4", detail: "Increment of 9.0 ha is consistent with seasonal work." }
          }
        },
        {
          month: 8,
          date: "2026-01-16",
          claimed: 10.0,
          verified: 10.0,
          photo: "assets/img/mangrove-04.jpg",
          lat: 11.4276,
          lng: 79.7698,
          confidence: 100,
          checks: {
            relevance: { status: "pass", short: "veg 27%", detail: "27% vegetation pixels, healthy root establishment." },
            duplicate: { status: "pass", short: "hash 26/64", detail: "Closest earlier photo is 26/64 away. No reuse detected." },
            gps: { status: "pass", short: "0.05 km", detail: "0.05 km from site centroid, within tolerance." },
            plausibility: { status: "pass", short: "z = 0.5", detail: "Increment of 10.0 ha follows expected pace." }
          }
        },
        {
          month: 10,
          date: "2026-03-15",
          claimed: 9.5,
          verified: 9.5,
          photo: "assets/img/mangrove-05.jpg",
          lat: 11.4360,
          lng: 79.7770,
          confidence: 88,
          note: "Submitted 1.2 km from site centroid; within the 2.0 km tolerance.",
          checks: {
            relevance: { status: "pass", short: "veg 57%", detail: "57% vegetation pixels, dense mangrove cover." },
            duplicate: { status: "pass", short: "hash 34/64", detail: "Distinct new photo, no overlap." },
            gps: { status: "watch", short: "1.18 km", detail: "1.18 km from site centroid. Outside core zone but within 2.0 km tolerance." },
            plausibility: { status: "pass", short: "z = 0.3", detail: "Increment of 9.5 ha is consistent with project history." }
          }
        },
        {
          month: 12,
          date: "2026-05-16",
          claimed: 8.5,
          verified: 8.5,
          photo: "assets/img/mangrove-06.jpg",
          lat: 11.4283,
          lng: 79.7702,
          confidence: 100,
          checks: {
            relevance: { status: "pass", short: "veg 70%", detail: "70% vegetation pixels, mature canopy expansion." },
            duplicate: { status: "pass", short: "hash 31/64", detail: "Closest earlier photo is 31/64 away. Clean submission." },
            gps: { status: "pass", short: "0.04 km", detail: "0.04 km from site centroid, within tolerance." },
            plausibility: { status: "pass", short: "z = -0.1", detail: "Increment of 8.5 ha fits trajectory." }
          }
        },
        {
          month: 14,
          date: "2026-07-14",
          claimed: 9.0,
          verified: 9.0,
          photo: "assets/img/mangrove-07.jpg",
          lat: 11.4279,
          lng: 79.7696,
          confidence: 100,
          checks: {
            relevance: { status: "pass", short: "veg 38%", detail: "38% vegetation pixels, verified tidal growth." },
            duplicate: { status: "pass", short: "hash 25/64", detail: "Closest earlier photo is 25/64 away. New photo verified." },
            gps: { status: "pass", short: "0.05 km", detail: "0.05 km from site centroid, within tolerance." },
            plausibility: { status: "pass", short: "z = 0.1", detail: "Increment of 9.0 ha is right on track." }
          }
        }
      ]
    },
    {
      id: "zerowaste",
      name: "ZeroWaste Campus",
      org: "Green Campus Collective",
      kind: "waste",
      unit: "% waste reduced",
      target: 50,
      durationMonths: 10,
      startDate: "2026-03-15",
      deadline: "2027-01-15",
      site: { name: "University campus, Bhopal", lat: 23.443, lng: 77.201 },
      displayLocation: "Bhopal, India",
      projectType: "Waste Reduction",
      timeline: "10 months (Deadline: 2027-01-15)",
      progressScore: 88,
      evidenceScore: 92,
      consistencyScore: 94,
      ecoLensScore: 91,
      riskLevel: "Low",
      outcomePrediction: "On Track",
      riskAnalysis: {
        currentRisk: "Low",
        progressAnomaly: "Normal (Smooth diversion progression)",
        timelineRisk: "Low (Trajectory ahead of target)",
        predictedOutcome: "On Track (Projected to finish at ~69.2%)"
      },
      evidenceAnalysis: {
        photoRelevance: "Verified (Site facilities confirmed)",
        duplicateDetection: "No Duplicate (Audited receipts and scales)",
        locationConsistency: "Consistent (0.04 km campus radius)",
        evidenceConfidence: "92%"
      },
      gpsToleranceKm: 0.5,
      updates: [
        {
          month: 1,
          date: "2026-04-12",
          claimed: 5.0,
          verified: 5.0,
          photo: "assets/img/waste-01.jpg",
          lat: 23.4432,
          lng: 77.2013,
          confidence: 100,
          checks: {
            relevance: { status: "na", short: "veg n/a", detail: "Vegetation check not applicable for waste reduction project." },
            duplicate: { status: "na", short: "first photo", detail: "Initial recycling center photo logged." },
            gps: { status: "pass", short: "0.04 km", detail: "0.04 km from campus centroid, within 0.5 km tolerance." },
            plausibility: { status: "na", short: "no history", detail: "Baseline waste audit month." }
          }
        },
        {
          month: 2,
          date: "2026-05-10",
          claimed: 6.0,
          verified: 6.0,
          photo: "assets/img/waste-02.jpg",
          lat: 23.4428,
          lng: 77.2007,
          confidence: 100,
          checks: {
            relevance: { status: "na", short: "veg n/a", detail: "Vegetation check not applicable for waste project." },
            duplicate: { status: "pass", short: "hash 29/64", detail: "Closest earlier photo is 29/64 away. New photo verified." },
            gps: { status: "pass", short: "0.04 km", detail: "0.04 km from campus centroid, within tolerance." },
            plausibility: { status: "pass", short: "z = 0.2", detail: "Increment of 6.0% fits rollout plan." }
          }
        },
        {
          month: 3,
          date: "2026-06-11",
          claimed: 7.0,
          verified: 7.0,
          photo: "assets/img/waste-03.jpg",
          lat: 23.4431,
          lng: 77.2009,
          confidence: 100,
          checks: {
            relevance: { status: "na", short: "veg n/a", detail: "Vegetation check not applicable." },
            duplicate: { status: "pass", short: "hash 32/64", detail: "Distinct new segregation bin evidence." },
            gps: { status: "pass", short: "0.02 km", detail: "0.02 km from site centroid, within tolerance." },
            plausibility: { status: "pass", short: "z = 0.3", detail: "Increment of 7.0% is on track." }
          }
        },
        {
          month: 4,
          date: "2026-07-12",
          claimed: 7.0,
          verified: 7.0,
          photo: "assets/img/waste-04.jpg",
          lat: 23.4429,
          lng: 77.2011,
          confidence: 100,
          checks: {
            relevance: { status: "na", short: "veg n/a", detail: "Vegetation check not applicable." },
            duplicate: { status: "pass", short: "hash 27/64", detail: "No reuse detected across facility photos." },
            gps: { status: "pass", short: "0.02 km", detail: "0.02 km from site centroid, within tolerance." },
            plausibility: { status: "pass", short: "z = 0.1", detail: "Increment of 7.0% matches ongoing diversion rate." }
          }
        },
        {
          month: 5,
          date: "2026-08-11",
          claimed: 8.0,
          verified: 8.0,
          photo: "assets/img/waste-05.jpg",
          lat: 23.4433,
          lng: 77.2012,
          confidence: 100,
          checks: {
            relevance: { status: "na", short: "veg n/a", detail: "Vegetation check not applicable." },
            duplicate: { status: "pass", short: "hash 30/64", detail: "Unique composting station documentation." },
            gps: { status: "pass", short: "0.04 km", detail: "0.04 km from centroid, within tolerance." },
            plausibility: { status: "pass", short: "z = 0.4", detail: "Increment of 8.0% is consistent with cafeteria diversion." }
          }
        },
        {
          month: 6,
          date: "2026-08-30",
          claimed: 8.0,
          verified: 8.0,
          photo: "assets/img/waste-06.jpg",
          lat: 23.4430,
          lng: 77.2008,
          confidence: 100,
          checks: {
            relevance: { status: "na", short: "veg n/a", detail: "Vegetation check not applicable." },
            duplicate: { status: "pass", short: "hash 28/64", detail: "Clean new photo verified." },
            gps: { status: "pass", short: "0.02 km", detail: "0.02 km from centroid, within tolerance." },
            plausibility: { status: "pass", short: "z = 0.2", detail: "Increment of 8.0% maintains steady diversion pace." }
          }
        }
      ]
    }
  ]
};
