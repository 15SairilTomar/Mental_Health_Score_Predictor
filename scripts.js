
const API_URL = "https://mental-health-score-predictor-7w6s.onrender.com";


// Get HTML elements
const form = document.getElementById("predictionForm");

const predictButton = document.getElementById("predictButton");
const buttonText = document.getElementById("buttonText");
const buttonSpinner = document.getElementById("buttonSpinner");

const resetButton = document.getElementById("resetButton");

const errorBox = document.getElementById("errorBox");

const emptyResult = document.getElementById("emptyResult");
const loadingResult = document.getElementById("loadingResult");
const successResult = document.getElementById("successResult");
const apiErrorResult = document.getElementById("apiErrorResult");

const apiErrorText = document.getElementById("apiErrorText");

const scoreValue = document.getElementById("scoreValue");
const scoreProgress = document.getElementById("scoreProgress");


// --------------------------------------------------
// Get value from input
// --------------------------------------------------

function getValue(id) {
    return document.getElementById(id).value.trim();
}


// --------------------------------------------------
// Loading button
// --------------------------------------------------

function setLoading(isLoading) {

    predictButton.disabled = isLoading;

    buttonSpinner.hidden = !isLoading;

    if (isLoading) {
        buttonText.textContent = "Generating Prediction...";
    } else {
        buttonText.textContent = "Predict Mental Health Score";
    }
}


// --------------------------------------------------
// Show result state
// --------------------------------------------------

function showResultState(state) {

    emptyResult.hidden = state !== "empty";

    loadingResult.hidden = state !== "loading";

    successResult.hidden = state !== "success";

    apiErrorResult.hidden = state !== "error";
}


// --------------------------------------------------
// Show form error
// --------------------------------------------------

function showFormError(message) {

    errorBox.textContent = message;

    errorBox.hidden = false;
}


// --------------------------------------------------
// Clear form error
// --------------------------------------------------

function clearFormError() {

    errorBox.textContent = "";

    errorBox.hidden = true;
}


// --------------------------------------------------
// Remove invalid styling
// --------------------------------------------------

function clearInvalidFields() {

    document
        .querySelectorAll(".invalid")
        .forEach(function(element) {

            element.classList.remove("invalid");

        });
}


// --------------------------------------------------
// Validate form
// --------------------------------------------------

function validateForm() {

    clearInvalidFields();

    let firstInvalid = null;


    // Check required fields
    const requiredFields =
        [...form.querySelectorAll("[required]")];


    for (const field of requiredFields) {

        if (!field.value.trim()) {

            field.classList.add("invalid");

            if (!firstInvalid) {
                firstInvalid = field;
            }
        }
    }


    // Get numeric values
    const age =
        Number(getValue("Age"));

    const dailyUsage =
        Number(getValue("Avg_Daily_Usage_Hours"));

    const studyHours =
        Number(getValue("Study_Hours"));

    const activityHours =
        Number(getValue("Physical_Activity_Hours"));

    const sleepHours =
        Number(getValue("Sleep_Hours_Per_Night"));

    const dailyUnlocks =
        Number(getValue("Daily_Unlocks"));


    // Numeric validation
    const numericChecks = [

        ["Age", age, 10, 100],

        [
            "Avg_Daily_Usage_Hours",
            dailyUsage,
            0,
            24
        ],

        [
            "Study_Hours",
            studyHours,
            0,
            24
        ],

        [
            "Physical_Activity_Hours",
            activityHours,
            0,
            24
        ],

        [
            "Sleep_Hours_Per_Night",
            sleepHours,
            0,
            24
        ]

    ];


    for (const [id, value, min, max] of numericChecks) {

        if (
            !Number.isFinite(value) ||
            value < min ||
            value > max
        ) {

            const field =
                document.getElementById(id);

            field.classList.add("invalid");

            if (!firstInvalid) {
                firstInvalid = field;
            }
        }
    }


    // Daily unlock validation
    if (
        !Number.isFinite(dailyUnlocks) ||
        dailyUnlocks < 0 ||
        !Number.isInteger(dailyUnlocks)
    ) {

        const field =
            document.getElementById("Daily_Unlocks");

        field.classList.add("invalid");

        if (!firstInvalid) {
            firstInvalid = field;
        }
    }


    // If something is invalid
    if (firstInvalid) {

        showFormError(
            "Please check the highlighted fields and enter valid values."
        );

        firstInvalid.focus();

        return false;
    }


    clearFormError();

    return true;
}


// --------------------------------------------------
// Build JSON data
// --------------------------------------------------

function buildPayload() {

    return {

        Age:
            Number(getValue("Age")),

        Gender:
            getValue("Gender"),

        Country:
            getValue("Country"),

        Academic_Level:
            getValue("Academic_Level"),

        Most_Used_Platform:
            getValue("Most_Used_Platform"),

        Purpose_Of_Use:
            getValue("Purpose_Of_Use"),

        Avg_Daily_Usage_Hours:
            Number(
                getValue("Avg_Daily_Usage_Hours")
            ),

        Daily_Unlocks:
            Number(
                getValue("Daily_Unlocks")
            ),

        Study_Hours:
            Number(
                getValue("Study_Hours")
            ),

        Physical_Activity_Hours:
            Number(
                getValue("Physical_Activity_Hours")
            ),

        Sleep_Hours_Per_Night:
            Number(
                getValue("Sleep_Hours_Per_Night")
            ),

        Stress_Level:
            getValue("Stress_Level")
    };
}


// --------------------------------------------------
// Format FastAPI error
// --------------------------------------------------

function formatApiError(data) {

    if (!data) {

        return "The server returned an unknown error.";

    }


    // Pydantic validation errors
    if (Array.isArray(data.detail)) {

        return data.detail
            .map(function(item) {

                const location =
                    Array.isArray(item.loc)
                        ? item.loc.join(" → ")
                        : "Input";

                return location + ": " + item.msg;

            })
            .join("\n");
    }


    // Normal FastAPI error
    if (typeof data.detail === "string") {

        return data.detail;

    }


    return "The server could not process the request.";
}


// --------------------------------------------------
// FORM SUBMIT
// --------------------------------------------------

form.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        // Validate input
        if (!validateForm()) {

            showResultState("error");

            apiErrorText.textContent =
                "Please correct the highlighted form fields.";

            return;
        }


        // Start loading
        setLoading(true);

        clearFormError();

        showResultState("loading");


        try {

            // Send request to FastAPI
            const response = await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(
                        buildPayload()
                    )
                }
            );


            // Read response
            let data = null;

            try {

                data = await response.json();

            } catch {

                throw new Error(
                    "The API returned an invalid response."
                );
            }


            // API returned error
            if (!response.ok) {

                throw new Error(
                    formatApiError(data)
                );
            }


            // Get prediction
            const score =
                Number(
                    data.predicted_mental_health_score
                );


            // Validate prediction
            if (!Number.isFinite(score)) {

                throw new Error(
                    "The API response did not contain a valid prediction."
                );
            }


            // Display score
            scoreValue.textContent =
                score.toFixed(2);


        

            const visualPercent =
                Math.max(
                    0,
                    Math.min(10, score) * 10
                );


            scoreProgress.style.width = "0%";


            // Show successful result
            showResultState("success");


            // Animate progress bar
            requestAnimationFrame(function() {

                requestAnimationFrame(function() {

                    scoreProgress.style.width =
                        visualPercent + "%";

                });

            });


        } catch (error) {

            console.error(
                "Prediction error:",
                error
            );


            showResultState("error");


            /*
                If browser cannot connect
                to FastAPI
            */

            const isNetworkError =
                error instanceof TypeError ||
                /failed to fetch|networkerror|load failed/i
                    .test(error.message);


            if (isNetworkError) {

                apiErrorText.textContent =
                    "Could not connect to FastAPI. " +
                    "Make sure your backend is running at " +
                    "http://localhost:8000.";

            } else {

                apiErrorText.textContent =
                    error.message;
            }


        } finally {

            setLoading(false);

        }

    }
);


// --------------------------------------------------
// RESET BUTTON
// --------------------------------------------------

resetButton.addEventListener(
    "click",
    function() {

        form.reset();

        clearFormError();

        clearInvalidFields();

        scoreValue.textContent = "0.00";

        scoreProgress.style.width = "0%";

        showResultState("empty");

    }
);


// --------------------------------------------------
// Remove red border while typing
// --------------------------------------------------

form
    .querySelectorAll("input, select")
    .forEach(function(field) {

        field.addEventListener(
            "input",
            function() {

                field.classList.remove("invalid");

            }
        );


        field.addEventListener(
            "change",
            function() {

                field.classList.remove("invalid");

            }
        );

    });
