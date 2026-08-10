let SESSION = null;
let CREATORS = [];
let CURRENT_CREATOR = null;
let CURRENT_REEL = null;
let CURRENT_REEL_NUMBER = null;

/* ===========================================================
   INITIALIZE
=========================================================== */

window.addEventListener("load", () => {
    validateSession();
});

/* ===========================================================
   SESSION
=========================================================== */

function validateSession() {
    const raw = localStorage.getItem("SHEIN_SESSION");
    if (!raw) {
        location.href = "index.html";
        return;
    }
    SESSION = JSON.parse(raw);
    if (SESSION.role !== "CA") {
        location.href = "index.html";
        return;
    }
    document.getElementById("welcomeText").innerHTML =
        "Welcome, " + SESSION.name;
    startSessionTimer();
    loadDashboard();
}

function logout() {
    localStorage.removeItem("SHEIN_SESSION");
    location.href = "index.html";
}

/* ===========================================================
   AUTO LOGOUT (15 MINUTES INACTIVE)
=========================================================== */
const SESSION_TIMEOUT = 15 * 60 * 1000;
let inactivityTimer;
function startSessionTimer() {

    resetSessionTimer();
    [
        "mousemove",
        "mousedown",
        "click",
        "scroll",
        "keypress",
        "touchstart"
    ].forEach(event => {
        document.addEventListener(
            event,
           resetSessionTimer
        );
    });
}

function resetSessionTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        alert("Your session has expired.");
        logout();
    }, SESSION_TIMEOUT);
}

/* ===========================================================
   LOAD DASHBOARD
=========================================================== */

async function loadDashboard() {

    try {
        const response = await fetch(
            CONFIG.API_URL +
            "?action=getCAOverview" +
            "&assignedCA=" +
            encodeURIComponent(SESSION.name)
        );
        const data = await response.json();
        if (!data.success) {
            alert(data.message);
            return;
        }
        CREATORS = data.creators;
        renderDashboard();
    }
    catch (err) {
        console.error(err);
        alert("Unable to connect.");
    }
}


/* ===========================================================
   RENDER
=========================================================== */

function renderDashboard() {

    document.getElementById("totalCreators").innerHTML =
        CREATORS.length;

    let reel1 = 0;
    let reel2 = 0;

    CREATORS.forEach(c => {

        if (c.reel1.exists) {
            reel1++;
        }

        if (c.reel2.exists) {
            reel2++;
        }

    });
    document.getElementById("reel1Count").innerHTML =
        reel1;
    document.getElementById("reel2Count").innerHTML =
        reel2;
    renderCreatorCards(CREATORS);

}


/* ===========================================================
   SEARCH
=========================================================== */
document
.getElementById("searchCreators")
.addEventListener(
    "input",
    function () {
        const q =
            this.value
            .trim()
            .toLowerCase();
        const filtered =
            CREATORS.filter(c =>
                c.name
                .toLowerCase()
                .includes(q)
                ||
                c.instagram
                .toLowerCase()
                .includes(q)
            );
        renderCreatorCards(filtered);
    }
);

/* ===========================================================
   CREATOR CARD RENDERING
=========================================================== */

function renderCreatorCards(creators){

    const container =
        document.getElementById("creatorContainer");

    container.innerHTML = "";

    creators.forEach(creator=>{

        let html = `

        <div class="creatorSection">

            <div class="creatorSectionHeader">

                <div class="creatorIdentity">

                    <span class="creatorEmoji">
                        👤
                    </span>

                    <span class="creatorSectionName">
                        ${creator.name}
                    </span>

                    <span class="creatorDivider">
                        |
                    </span>

                    <a
                        class="creatorSectionInstagram"
                        href="https://instagram.com/${creator.instagram}"
                        target="_blank">

                        @${creator.instagram}

                    </a>

                    <span class="creatorDivider">
                        |
                    </span>

                    <span class="creatorFollowers">

                        ${Number(creator.followers || 0).toLocaleString()} Followers

                    </span>

                </div>

            </div>

        `;

        html += buildCARow(
            creator,
            creator.reel1,
            1,
            "Reel 1"
        );

        html += buildCARow(
            creator,
            creator.reel2,
            2,
            "Reel 2"
        );

        html += `
        </div>
        `;

        container.innerHTML += html;

    });

}

function buildCARow(
    creator,
    reel,
    reelNumber,
    title
){

    if(!reel.exists){

        return `

        <div class="creatorReelRow">

            <div class="creatorReelTitle">

                ${title}

            </div>

            <div class="creatorReelStatus statusEmpty">

                Not Submitted

            </div>

            <div class="creatorReelActions">

                <button
                    class="reviewButton"
                    onclick="openReelModal(
                        '${creator.creatorID}',
                        ${reelNumber}
                    )">

                    Submit

                </button>

            </div>

        </div>

        `;

    }

    if(reel.status=="APPROVED"){

        return `

        <div class="creatorReelRow">

            <div class="creatorReelTitle">

                ${title}

            </div>

            <div class="creatorReelStatus statusApproved">

                Approved

            </div>

            <div class="creatorReelActions">

                <a
                    href="${reel.link}"
                    target="_blank"
                    class="viewReelButton">

                    View Post

                </a>

            </div>

        </div>

        `;

    }

    if(reel.status=="PENDING"){

        return `

        <div class="creatorReelRow">

            <div class="creatorReelTitle">

                ${title}

            </div>

            <div class="creatorReelStatus statusPending">

                Pending Approval

            </div>

            <div class="creatorReelActions">

                <a
                    href="${reel.link}"
                    target="_blank"
                    class="viewReelButton">

                    View Post

                </a>

            </div>

        </div>

        `;

    }

    return `

    <div class="creatorReelRow">

        <div class="creatorReelTitle">

            ${title}

        </div>

        <div class="creatorReelStatus statusRejected">

            Rejected

        </div>

        <div class="creatorReelActions">

            <button
                class="reviewButton"
                onclick="openReelModal(
                    '${creator.creatorID}',
                    ${reelNumber}
                )">

                Resubmit

                </button>

        </div>

    </div>

    `;

}


/* ===========================================================
   REEL HTML
=========================================================== */

function reelHTML(creator, reel, reelNumber) {
    if (reel.exists) {
        let badge = "";
        if (reel.status === "APPROVED") {
            badge =
                "<span class='status approved'>Approved</span>";
        }
        else if (reel.status === "PENDING") {
            badge =
                "<span class='status pending'>Pending Approval</span>";
        }
        else {
            badge =
                "<span class='status rejected'>Rejected</span>";
        }

        return `
        <div class="reelRowContent">
            <div>
                <div class="reelHeading">
                    Reel ${reel.exists
? reel.reelNumber
: reelNumber}
                </div>
                ${badge}
            </div>
            <div class="reelActions">
                <a
                    href="${reel.link}"
                    target="_blank"
                    class="viewButton"
                >
                    View Reel
                </a>
            </div>
        </div>
        `;
    }

    return `

    <div class="reelRowContent">
        <div>
            <div class="reelHeading">
                Reel ${reel.exists
? reel.reelNumber
: reelNumber}
            </div>
            <span class="status notSubmitted">
                Not Submitted
            </span>
        </div>
        <div>
            <button
                class="submitButton"
                onclick="openReelModal(
                '${creator.creatorID}',
                ${reel.exists
? reel.reelNumber
: reelNumber}
                )"
            >
                Submit Reel
            </button>
        </div>
    </div>
    `;
}


/* ===========================================================
   EXPAND / COLLAPSE
=========================================================== */

function toggleCreator(header) {
    const clickedCard =
        header.parentElement;
    const cards =
        document.querySelectorAll(".creatorCard");
    cards.forEach(card => {
        if (card !== clickedCard) {
            card.classList.remove("open");
        }
    });
    clickedCard.classList.toggle("open");
}

/* ===========================================================
   ADD CREATOR MODAL
=========================================================== */

function openCreatorModal() {

    clearCreatorForm();

    const errorBox =
        document.getElementById("creatorError");

    if (errorBox) {
        errorBox.innerHTML = "";
    }

    const button =
        document.getElementById("addCreatorButton");

    button.disabled = false;
    button.innerHTML = "Add Creator";

    document
        .getElementById("creatorModal")
        .classList
        .remove("hidden");

}

function closeCreatorModal() {

    const errorBox =
        document.getElementById("creatorError");

    if (errorBox) {
        errorBox.innerHTML = "";
    }

    const button =
        document.getElementById("addCreatorButton");

    button.disabled = false;
    button.innerHTML = "Add Creator";

    document
        .getElementById("creatorModal")
        .classList
        .add("hidden");

}

function clearCreatorForm() {

    document.getElementById("creatorName").value = "";
    document.getElementById("creatorPhone").value = "";
    document.getElementById("creatorEmail").value = "";
    document.getElementById("creatorInstagram").value = "";
    document.getElementById("creatorFollowers").value = "";

    const errorBox =
        document.getElementById("creatorError");

    if (errorBox) {
        errorBox.innerHTML = "";
    }

}


/* ===========================================================
   ADD CREATOR
=========================================================== */

async function addCreator() {

    const button =
        document.getElementById("addCreatorButton");

    const errorBox =
        document.getElementById("creatorError");

    if (errorBox) {
        errorBox.innerHTML = "";
    }

    const name =
        document.getElementById("creatorName").value.trim();

    const phone =
        document.getElementById("creatorPhone").value.trim();

    const email =
        document.getElementById("creatorEmail").value.trim();

    const instagram =
        document.getElementById("creatorInstagram").value.trim();

    const followers =
        document.getElementById("creatorFollowers").value.trim();

    if (
        !name ||
        !phone ||
        !email ||
        !instagram ||
        !followers
    ) {

        if (errorBox) {
            errorBox.innerHTML =
                "Please complete all fields.";
        }

        return;

    }

    button.disabled = true;
    button.innerHTML = "Adding...";

    try {

        const response = await fetch(

            CONFIG.API_URL +

            "?action=addCreator" +

            "&name=" +
            encodeURIComponent(name) +

            "&phone=" +
            encodeURIComponent(phone) +

            "&email=" +
            encodeURIComponent(email) +

            "&instagram=" +
            encodeURIComponent(instagram) +

            "&followers=" +
            encodeURIComponent(followers) +

            "&college=" +
            encodeURIComponent(SESSION.college) +

            "&assignedLCA=" +
            encodeURIComponent(SESSION.assignedLCA) +

            "&assignedCA=" +
            encodeURIComponent(SESSION.name)

        );

        const data =
            await response.json();

        if (data.success) {

            button.innerHTML = "Added ✓";

            await new Promise(
                resolve => setTimeout(resolve, 800)
            );

            closeCreatorModal();

            await loadDashboard();

        } else {

            button.disabled = false;
            button.innerHTML = "Add Creator";

            if (errorBox) {
                errorBox.innerHTML =
                    data.message ||
                    "Unable to add creator.";
            }

        }

    } catch (err) {

        console.error(err);

        button.disabled = false;
        button.innerHTML = "Add Creator";

        if (errorBox) {
            errorBox.innerHTML =
                "Unable to add creator. Please try again.";
        }

    }

}

/* ===========================================================
   REEL SUBMISSION MODAL
=========================================================== */
function openReelModal(
    creatorID,
    reelNumber
){

    CURRENT_CREATOR =
        creatorID;

    CURRENT_REEL_NUMBER =
        Number(reelNumber);

    const input =
        document.getElementById("reelLink");

    const title =
        document.getElementById("reelTitle");

    const button =
        document.getElementById("submitReelButton");

    input.value = "";

    title.innerHTML =
        "Submit Reel " + CURRENT_REEL_NUMBER;

    button.disabled = false;

    button.innerHTML =
        "Submit Reel";

    document
        .getElementById("reelModal")
        .classList
        .remove("hidden");

}

function closeReelModal(){

    CURRENT_CREATOR = null;

    CURRENT_REEL = null;

    CURRENT_REEL_NUMBER = null;

    document
        .getElementById("reelLink")
        .value = "";

    const button =
        document.getElementById("submitReelButton");

    button.disabled = false;

    button.innerHTML =
        "Submit Post";

    document
        .getElementById("reelModal")
        .classList
        .add("hidden");

}

/* ===========================================================
   SUBMIT REEL
=========================================================== */

async function submitReel(){

    const button =
        document.getElementById("submitReelButton");

    const input =
        document.getElementById("reelLink");

    const postLink =
        input.value.trim();

    if(
        !CURRENT_CREATOR ||
        !CURRENT_REEL_NUMBER
    ){

        alert("Post information is missing.");

        return;

    }

    if(postLink === ""){

        alert("Please enter the post link.");

        return;

    }

    button.disabled = true;

    button.innerHTML =
        "Submitting...";

    try{

        const response =
            await fetch(

                CONFIG.API_URL +
                "?action=submitReel" +
                "&creatorID=" +
                encodeURIComponent(
                    CURRENT_CREATOR
                ) +
                "&reelNumber=" +
                encodeURIComponent(
                    CURRENT_REEL_NUMBER
                ) +
                "&reelLink=" +
                encodeURIComponent(
                    postLink
                ) +
                "&submittedBy=" +
                encodeURIComponent(
                    SESSION.name
                ) +
                "&t=" +
                Date.now()

            );

        const data =
            await response.json();

        if(!data.success){

            button.disabled = false;

            button.innerHTML =
                "Submit Post";

            alert(data.message);

            return;

        }

        button.innerHTML =
            "Submitted ✓";

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    800
                )
        );

        closeReelModal();

        await loadDashboard();

    }

    catch(err){

        console.error(err);

        button.disabled = false;

        button.innerHTML =
            "Submit Post";

        alert("Unable to submit.");

    }

}

/* ===========================================================
   UI HELPERS
=========================================================== */
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        closeCreatorModal();
        closeReelModal();
    }
});


window.addEventListener("click", function (e) {
    const creatorModal =
        document.getElementById("creatorModal");
    const reelModal =
        document.getElementById("reelModal");
    if (e.target === creatorModal) {
        closeCreatorModal();
    }
    if (e.target === reelModal) {
        closeReelModal();
    }
});


/* ===========================================================
   LOADING
=========================================================== */
function showLoading() {
    document.body.classList.add("loading");
}
function hideLoading() {
    document.body.classList.remove("loading");
}


/* ===========================================================
   REFRESH
=========================================================== */
async function refreshDashboard() {
    showLoading();
    await loadDashboard();
    hideLoading();
}


/* ===========================================================
   AUTO REFRESH
=========================================================== */

setInterval(function () {
    loadDashboard();
}, 60000);


/* ===========================================================
   PAGE VISIBILITY
=========================================================== */
document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
        loadDashboard();
    }
});


/* ===========================================================
   COUNTER ANIMATION
=========================================================== */

function animateCounter(element, endValue) {
    const duration = 500;
    const startValue = 0;
    const startTime = performance.now();
    function update(now) {
        const progress = Math.min(
            (now - startTime) / duration,
            1
        );
      
        const value = Math.floor(
            progress *
            (endValue - startValue)
            +
            startValue
        );
        element.innerHTML = value;
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}


/* ===========================================================
   OVERRIDE RENDER
=========================================================== */
const originalRenderDashboard = renderDashboard;
renderDashboard = function () {
    originalRenderDashboard();
    animateCounter(
        document.getElementById("totalCreators"),
        CREATORS.length
    );

    let r1 = 0;
    let r2 = 0;
    let r3 = 0;

    CREATORS.forEach(c => {
        if (c.reel1.exists) r1++;
        if (c.reel2.exists) r2++;
        if (c.reel3.exists) r3++;
    });
  
    animateCounter(
        document.getElementById("reel1Count"),
        r1
    );
    animateCounter(
        document.getElementById("reel2Count"),
        r2
    );
    animateCounter(
        document.getElementById("reel3Count"),
        r3
    );
};

/* ===========================================================
   REFERRAL CARD
=========================================================== */

async function loadReferralData() {

    try {

        const response = await fetch(

            CONFIG.API_URL +

            "?action=getReferralData" +

            "&username=" +

            encodeURIComponent(SESSION.username)

        );

        const data = await response.json();

        if(data.success){

            document.getElementById("referralCount").innerHTML =
                data.referralCount;

            SESSION.referralCode =
                data.referralCode;

            SESSION.referralCount =
                data.referralCount;

            localStorage.setItem(
                "SHEIN_SESSION",
                JSON.stringify(SESSION)
            );

        }

    }

    catch(err){

        console.error(err);

    }

}


/* ===========================================================
   ORDER MODAL
=========================================================== */

function openOrderModal(){

    document.getElementById("orderID").value = "";

    document.getElementById("orderScreenshot").value = "";

    const dropdown =
        document.getElementById("orderCreator");

    dropdown.innerHTML =
        "<option value=''>Select Creator</option>";

    CREATORS.forEach(creator=>{

        dropdown.innerHTML +=
            `<option value="${creator.creatorID}">
                ${creator.name}
            </option>`;

    });

    document
        .getElementById("orderModal")
        .classList
        .remove("hidden");

}

function closeOrderModal(){

    document
        .getElementById("orderModal")
        .classList
        .add("hidden");

}

function fileToBase64(file){

    return new Promise((resolve,reject)=>{

        const reader = new FileReader();

        reader.onload = ()=>resolve(reader.result);

        reader.onerror = reject;

        reader.readAsDataURL(file);

    });

}

/* ===========================================================
   SUBMIT ORDER
=========================================================== */

async function submitOrder() {

    const creatorID =
        document.getElementById("orderCreator").value;

    const orderID =
        document.getElementById("orderID").value.trim();

    const file =
        document.getElementById("orderScreenshot").files[0];

    if (!creatorID || !orderID || !file) {

        alert("Please complete all fields.");

        return;

    }

    const button =
        document.getElementById("submitOrderButton");

    button.disabled = true;

    button.innerHTML = "Uploading...";

    try {

        const base64 =
            await fileToBase64(file);

        const response = await fetch(

            CONFIG.API_URL + "?action=submitOrder",

            {

                method:"POST",

                body:JSON.stringify({

                    creatorID: creatorID,

                    orderID: orderID,

                    caName: SESSION.name,

                    college: SESSION.college,

                    referralCode: SESSION.referralCode,

                    screenshot: base64

                })

            }

        );

        const data =
            await response.json();

        if(data.success){

            button.innerHTML = "Submitted ✓";

            setTimeout(()=>{

                closeOrderModal();

                button.disabled = false;

                button.innerHTML = "Submit Order";

            },800);

        }

        else{

            button.disabled = false;

            button.innerHTML = "Submit Order";

            alert(data.message);

        }

    }

    catch(err){

        console.error(err);

        button.disabled = false;

        button.innerHTML = "Submit Order";

        alert("Upload failed.");

    }

}

/* ===========================================================
   MODAL ESCAPE
=========================================================== */
const originalKeyListener = document.onkeydown;
document.addEventListener("keydown",function(e){
    if(e.key==="Escape"){
        closeOrderModal();
    }
});

window.addEventListener("click",function(e){
    const modal =
        document.getElementById("orderModal");
    if(e.target===modal){
        closeOrderModal();
    }
});


/* ===========================================================
   LOAD REFERRALS ON DASHBOARD
=========================================================== */

const originalLoadDashboard = loadDashboard;
loadDashboard = async function(){
    await originalLoadDashboard();
    await loadReferralData();
};

function updateFileName(input) {

    const label =
        document.getElementById("selectedFileName");

    if (input.files.length) {

        label.textContent =
            input.files[0].name;

    } else {

        label.textContent =
            "No file selected";

    }

}
