let SESSION = null;
let CAMPUS_AMBASSADORS = [];
let CURRENT_REEL_ID = null;


window.addEventListener("load", () => {
    validateSession();
});


function validateSession() {
    const raw = localStorage.getItem("SHEIN_SESSION");
    if (!raw) {
        location.href = "index.html";
        return;
    }
    SESSION = JSON.parse(raw);

    if (SESSION.role !== "LCA") {
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

async function loadDashboard() {

    try {

        const response = await fetch(

            CONFIG.API_URL +
            "?action=getLCAOverview" +
            "&lcaName=" +
            encodeURIComponent(SESSION.name)

        );

        const data = await response.json();

        if (!data.success) {

            alert(data.message);
            return;

        }

        CAMPUS_AMBASSADORS =
            data.campusAmbassadors;

        document.getElementById("referralCount").innerText =
            data.referralCount || 0;

        renderDashboard();

    }

    catch (err) {

        console.error(err);
        alert("Unable to connect.");

    }

}


function renderDashboard() {

    document.getElementById("totalCA").innerHTML =
        CAMPUS_AMBASSADORS.length;

    let approved = 0;
    let pending = 0;
    let rejected = 0;

    CAMPUS_AMBASSADORS.forEach(ca => {

        ca.creators.forEach(creator => {

            creator.reels.forEach(post => {

                if (post.status === "APPROVED") {
                    approved++;
                }

                if (post.status === "PENDING") {
                    pending++;
                }

                if (post.status === "REJECTED") {
                    rejected++;
                }

            });

        });

    });

    document.getElementById("approvedReels").innerHTML =
        approved;

    document.getElementById("pendingReels").innerHTML =
        pending;

    document.getElementById("rejectedReels").innerHTML =
        rejected;

    renderCACards(CAMPUS_AMBASSADORS);

}

document
.getElementById("searchCA")
.addEventListener(
    "input",
    function(){
        const q =
            this.value
            .trim()
            .toLowerCase();
        const filtered =
        CAMPUS_AMBASSADORS.filter(ca =>
            ca.caName
            .toLowerCase()
            .includes(q)
        );
        renderCACards(filtered);
    }
);

function renderCACards(list){

    const container =
        document.getElementById("caContainer");

    container.innerHTML = "";

    const template =
        document.getElementById("caTemplate");

    list.forEach(ca=>{

        const node =
            template.content.cloneNode(true);

        node.querySelector(".caName").innerHTML =
            ca.caName;

        node.querySelector(".caStats").innerHTML =
            `
            ${ca.creators.length} Creators
            &nbsp;&nbsp;•&nbsp;&nbsp;
            ${ca.totalApprovedReels} Reels
            &nbsp;&nbsp;•&nbsp;&nbsp;
            ${Number(ca.totalReferrals || 0).toLocaleString()} Referrals
            `;

        const creatorList =
            node.querySelector(".creatorList");

        creatorList.innerHTML =
            buildCreatorHTML(ca.creators);

        container.appendChild(node);

    });

}

function buildCreatorHTML(creators){

    let html = "";

    creators.forEach(creator=>{

        html += `

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

        const postTypes = [
            {
                number: 1,
                title: "Reel 1"
            },
            {
                number: 2,
                title: "Reel 2"
            }
        ];

        postTypes.forEach(postType=>{

            const post = creator.reels.find(

                item =>
                    Number(item.reelNumber) === postType.number

            );

            if(!post){

                html += `

                <div class="creatorReelRow">

                    <div class="creatorReelTitle">

                        ${postType.title}

                    </div>

                    <div class="creatorReelStatus statusEmpty">

                        Not Submitted

                    </div>

                    <div class="creatorReelActions">

                        —

                    </div>

                </div>

                `;

                return;

            }

            if(post.status==="PENDING"){

                html += `

                <div class="creatorReelRow">

                    <div class="creatorReelTitle">

                        ${postType.title}

                    </div>

                    <div class="creatorReelStatus statusPending">

                        Pending Approval

                    </div>

                    <div class="creatorReelActions">

                        <a
                            href="${post.reelLink || post.link}"
                            target="_blank"
                            class="viewReelButton">

                            View Reel

                        </a>

                        <button
                            class="reviewButton"
                            onclick="openApprovalModal('${post.reelID}')">

                            Review

                        </button>

                    </div>

                </div>

                `;

                return;

            }

            if(post.status==="APPROVED"){

                html += `

                <div class="creatorReelRow">

                    <div class="creatorReelTitle">

                        ${postType.title}

                    </div>

                    <div class="creatorReelStatus statusApproved">

                        Approved

                    </div>

                    <div class="creatorReelActions">

                        <a
                            href="${post.reelLink || post.link}"
                            target="_blank"
                            class="viewReelButton">

                            View Reel

                        </a>

                    </div>

                </div>

                `;

                return;

            }

            html += `

            <div class="creatorReelRow">

                <div class="creatorReelTitle">

                    ${postType.title}

                </div>

                <div class="creatorReelStatus statusRejected">

                    Rejected

                </div>

                <div class="creatorReelActions">

                    <a
                        href="${post.reelLink || post.link}"
                        target="_blank"
                        class="viewReelButton">

                        View Reel

                    </a>

                </div>

            </div>

            `;

        });

        html += `

        </div>

        `;

    });

    return html;

}

function toggleCA(header){
    const clicked =
        header.parentElement;
    document
    .querySelectorAll(".creatorCard")
    .forEach(card=>{
        if(card!==clicked){
            card.classList.remove("open");
        }
    });
    clicked.classList.toggle("open");
}

function openApprovalModal(postID){

    CURRENT_REEL_ID =
        postID;

    document
        .getElementById("approvalMessage")
        .innerHTML =
        "Approve or reject this post?";

    document
        .getElementById("approvalModal")
        .classList
        .remove("hidden");

}

function closeApprovalModal(){
    CURRENT_REEL_ID = null;
    document
    .getElementById("approvalModal")
    .classList
    .add("hidden");
}


function openCreatorModal(){

    document.getElementById("creatorName").value="";
    document.getElementById("creatorPhone").value="";
    document.getElementById("creatorEmail").value="";
    document.getElementById("creatorInstagram").value="";
    document.getElementById("creatorFollowers").value="";

    const dropdown =
        document.getElementById("creatorAssignedCA");

    dropdown.innerHTML =
        "<option value=''>Select Campus Ambassador</option>";

    CAMPUS_AMBASSADORS.forEach(ca=>{

        dropdown.innerHTML +=
        `<option value="${ca.caName}">
            ${ca.caName}
        </option>`;

    });

    document
        .getElementById("creatorModal")
        .classList
        .remove("hidden");

}

function closeCreatorModal(){

    document
        .getElementById("creatorModal")
        .classList
        .add("hidden");

}

async function addCreator(){

    const assignedCA =
        document.getElementById("creatorAssignedCA").value;

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

    if(
        !assignedCA||
        !name||
        !phone||
        !email||
        !instagram||
        !followers
    ){

        alert("Please complete all fields.");
        return;

    }

    const button =
        document.getElementById("addCreatorButton");

    button.disabled=true;
    button.innerHTML="Adding...";

    try{

        const response=await fetch(

            CONFIG.API_URL+

            "?action=addCreator"+

            "&name="+encodeURIComponent(name)+

            "&phone="+encodeURIComponent(phone)+

            "&email="+encodeURIComponent(email)+

            "&instagram="+encodeURIComponent(instagram)+

            "&followers="+encodeURIComponent(followers)+

            "&college="+encodeURIComponent(SESSION.college)+

            "&assignedLCA="+encodeURIComponent(SESSION.name)+

            "&assignedCA="+encodeURIComponent(assignedCA)

        );

        const data=await response.json();

        if(data.success){

            button.innerHTML="Added ✓";

            setTimeout(()=>{

                closeCreatorModal();

                button.disabled=false;
                button.innerHTML="Add Creator";

                loadDashboard();

            },700);

        }

        else{

            button.disabled=false;
            button.innerHTML="Add Creator";

            alert(data.message);

        }

    }

    catch(err){

        console.error(err);

        button.disabled=false;
        button.innerHTML="Add Creator";

        alert("Unable to add creator.");

    }

}

/* ===========================================================
   APPROVE
=========================================================== */

async function approveCurrentReel(){
    const buttons =
        document.querySelectorAll("#approvalModal button");
    buttons.forEach(btn=>btn.disabled=true);
    const approveButton =
        buttons[1];
    approveButton.innerHTML =
        "Approving...";

    try{
        const response = await fetch(
            CONFIG.API_URL +
            "?action=approveReel" +
            "&reelID=" +
            encodeURIComponent(CURRENT_REEL_ID) +
            "&approvedBy=" +
            encodeURIComponent(SESSION.name)
        );

        const data =
            await response.json();

        if(data.success){
            approveButton.innerHTML =
                "Approved ✓";
            await new Promise(resolve=>setTimeout(resolve,700));
            closeApprovalModal();
            await loadDashboard();
        }

        else{
            buttons.forEach(btn=>btn.disabled=false);
            approveButton.innerHTML =
                "Approve";
            alert(data.message);
        }
    }
    catch(err){
        console.error(err);
        buttons.forEach(btn=>btn.disabled=false);
        approveButton.innerHTML =
            "Approve";
        alert("Unable to approve reel.");
    }
}


/* ===========================================================
   REJECT
=========================================================== */

async function rejectCurrentReel(){

    const buttons =
        document.querySelectorAll("#approvalModal button");

    buttons.forEach(btn=>btn.disabled=true);

    const rejectButton =
        buttons[2];

    rejectButton.innerHTML =
        "Rejecting...";

    try{

        const response = await fetch(

            CONFIG.API_URL +

            "?action=rejectReel" +

            "&reelID=" +
            encodeURIComponent(CURRENT_REEL_ID) +
            "&approvedBy=" +
            encodeURIComponent(SESSION.name)
        );

        const data =
            await response.json();
        if(data.success){
            rejectButton.innerHTML =
                "Rejected ✓";

            await new Promise(resolve=>setTimeout(resolve,700));
            closeApprovalModal();
            await loadDashboard();
        }

        else{
            buttons.forEach(btn=>btn.disabled=false);
            rejectButton.innerHTML =
                "Reject";
            alert(data.message);
        }
    }

    catch(err){
        console.error(err);
        buttons.forEach(btn=>btn.disabled=false);
        rejectButton.innerHTML =
            "Reject";
        alert("Unable to reject reel.");
    }
}


/* ===========================================================
   AUTO REFRESH
=========================================================== */
setInterval(function(){
    loadDashboard();
},60000);
