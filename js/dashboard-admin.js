let SESSION = null;
let COLLEGES = [];
let CURRENT_TYPE = "";
let CURRENT_ID = "";
let CURRENT_NAME = "";
/* ===========================================================
   INITIALIZE
=========================================================== */
window.addEventListener("load",()=>{
    validateSession();
});
/* ===========================================================
   SESSION
=========================================================== */
function validateSession(){
    const raw =
        localStorage.getItem("SHEIN_SESSION");
    if(!raw){
        location.href="index.html";
        return;
    }
    SESSION =
        JSON.parse(raw);
    if(SESSION.role!=="ADMIN"){
        location.href="index.html";
        return;
    }
    document.getElementById("welcomeText").innerHTML=
        "Welcome, "+SESSION.name;
    startSessionTimer();
    loadDashboard();
}

function logout(){
    localStorage.removeItem(
        "SHEIN_SESSION"
    );
    location.href="index.html";
}
/* ===========================================================
   AUTO LOGOUT
=========================================================== */

const SESSION_TIMEOUT =
    15*60*1000;
let inactivityTimer;
function startSessionTimer(){
    resetSessionTimer();
    [
        "mousemove",
        "mousedown",
        "click",
        "scroll",
        "keypress",
        "touchstart"
    ].forEach(event=>{
        document.addEventListener(
            event,
            resetSessionTimer
        );
    });
}
function resetSessionTimer(){
    clearTimeout(
        inactivityTimer
    );
    inactivityTimer=
        setTimeout(()=>{
            alert(
                "Your session has expired."
            );
            logout();
        },SESSION_TIMEOUT);
}


/* ===========================================================
   LOAD
=========================================================== */
async function loadDashboard(){
    try{
        const response =
            await fetch(
                CONFIG.API_URL+
                "?action=getAdminDashboard"+
                "&adminUsername="+
                encodeURIComponent(
                    SESSION.username
                )
            );
        const data =
            await response.json();
        if(!data.success){
            alert(data.message);
            return;
        }

        COLLEGES =
            data.colleges;
        renderOverview(
            data.overview
        );
        renderCollegeCards(
            COLLEGES
        );
    }

    catch(err){
        console.error(err);
        alert(
            "Unable to connect."
        );
    }
}

/* ===========================================================
   OVERVIEW
=========================================================== */

function renderOverview(overview){

    document
        .getElementById("activeLCAs")
        .innerHTML =
        Number(
            overview.activeLCAs || 0
        ).toLocaleString();

    document
        .getElementById("activeCAs")
        .innerHTML =
        Number(
            overview.activeCAs || 0
        ).toLocaleString();

    document
        .getElementById("activeCreators")
        .innerHTML =
        Number(
            overview.activeCreators || 0
        ).toLocaleString();

    document
        .getElementById("approvedReels")
        .innerHTML =
        Number(
            overview.approvedReels || 0
        ).toLocaleString();

    document
        .getElementById("approvedCarousels")
        .innerHTML =
        Number(
            overview.approvedCarousels || 0
        ).toLocaleString();

    document
        .getElementById("totalReferrals")
        .innerHTML =
        Number(
            overview.totalReferrals || 0
        ).toLocaleString();
}
/* ===========================================================
   COLLEGE CARDS
=========================================================== */
function renderCollegeCards(colleges){
    const container =
        document.getElementById(
            "collegeContainer"
        );
    const template =
        document.getElementById(
            "collegeTemplate"
        );
    container.innerHTML="";
    if(!colleges.length){
        container.innerHTML=`
            <div class="adminEmptyState">
                No colleges found.
            </div>
        `;
        return;
    }
    colleges.forEach(college=>{
        const node =
            template.content.cloneNode(
                true
            );
        node
            .querySelector(
                ".collegeName"
            )
            .textContent =
            college.college;
        node
            .querySelector(
                ".collegeStats"
            )
            .innerHTML = `
                ${Number(
                    college.totalCAs || 0
                ).toLocaleString()} CAs
                <span>•</span>
                ${Number(
                    college.totalCreators || 0
                ).toLocaleString()} Creators
                <span>•</span>
                ${Number(
                    college.totalPosts || 0
                ).toLocaleString()} Posts
                <span>•</span>
                ${Number(
                    college.totalReferrals || 0
                ).toLocaleString()} Referrals
            `;
        node
            .querySelector(
                ".collegeDetails"
            )
            .innerHTML =
            buildCollegeDetails(
                college
            );
        container.appendChild(
            node
        );
    });
}
/* ===========================================================
   COLLEGE DETAILS
=========================================================== */
function buildCollegeDetails(college){
    let html="";
    const lcas =
        Array.isArray(college.lcas)
            ? college.lcas
            : [];

    if(lcas.length){
        html+=`
            <div class="adminLCASection">
                <div class="adminSectionLabel">
                    Lead Campus Ambassador
                </div>
        `;
        lcas.forEach(lca=>{
            html+=`
                <div class="adminLCARow">
                    <span class="adminLCAName">
                        ${escapeHTML(
                            lca.name
                        )}
                    </span>
                    <span class="adminLCAReferrals">
                        ${Number(
                            lca.referrals || 0
                        ).toLocaleString()}
                        Referrals
                    </span>
                </div>
            `;
        });
        html+=`
            </div>
        `;
    }
    html+=`
        <div class="adminCASection">
            <div class="adminSectionLabel">
                Campus Ambassadors
            </div>
            ${buildCAList(
                college.campusAmbassadors || []
            )}
        </div>
    `;
    return html;
}

/* ===========================================================
   CAMPUS AMBASSADOR LIST
=========================================================== */

function buildCAList(campusAmbassadors){

    if(!campusAmbassadors.length){

        return `

            <div class="adminEmptyState">

                No active Campus Ambassadors.

            </div>

        `;

    }

    let html="";

    campusAmbassadors.forEach(ca=>{

        html+=`

            <div class="adminCACard">

                <div
                    class="adminCAHeader"
                    onclick="toggleAdminCA(this)">

                    <div class="adminCAIdentity">

                        <div class="adminCAName">

                            ${escapeHTML(
                                ca.name
                            )}

                        </div>

                        <div class="adminCAStats">

                            ${Number(
                                ca.totalCreators || 0
                            ).toLocaleString()} Creators

                            <span>•</span>

                            ${Number(
                                ca.totalPosts || 0
                            ).toLocaleString()} Posts

                            <span>•</span>

                            ${Number(
                                ca.referrals || 0
                            ).toLocaleString()} Referrals

                        </div>

                    </div>

                    <div class="adminCAActions">

                        <button
                            type="button"
                            class="adminDeactivateButton"
                            onclick="event.stopPropagation();openDeactivateModal(
                                'CA',
                                '${escapeAttribute(ca.username)}',
                                '${escapeAttribute(ca.name)}'
                            )">

                            Deactivate CA

                        </button>

                        <span class="adminExpandIcon">

                            ▼

                        </span>

                    </div>

                </div>

                <div class="adminCABody">

                    ${buildCreatorList(
                        ca.creators || []
                    )}

                </div>

            </div>

        `;

    });

    return html;

}


/* ===========================================================
   CREATOR LIST
=========================================================== */

function buildCreatorList(creators){

    if(!creators.length){

        return `

            <div class="adminEmptyState">

                No active creators under this CA.

            </div>

        `;

    }

    let html="";

    creators.forEach(creator=>{

        html+=`

            <div class="adminCreatorRow">

                <div class="adminCreatorIdentity">

                    <div class="adminCreatorName">

                        ${escapeHTML(
                            creator.name
                        )}

                    </div>

                    <div class="adminCreatorMeta">

                        <a
                            href="https://instagram.com/${escapeAttribute(
                                creator.instagram
                            )}"
                            target="_blank"
                            rel="noopener noreferrer">

                            @${escapeHTML(
                                creator.instagram
                            )}

                        </a>

                        <span>•</span>

                        ${Number(
                            creator.followers || 0
                        ).toLocaleString()} Followers

                    </div>

                </div>

                <div class="adminPostStatuses">

                    ${buildPostStatus(
                        "Reel",
                        creator.reel
                    )}

                    ${buildPostStatus(
                        "Carousel",
                        creator.carousel
                    )}

                </div>

                <button
                    type="button"
                    class="adminDeactivateButton"
                    onclick="openDeactivateModal(
                        'CREATOR',
                        '${escapeAttribute(creator.creatorID)}',
                        '${escapeAttribute(creator.name)}'
                    )">

                    Deactivate

                </button>

            </div>

        `;

    });

    return html;

}


/* ===========================================================
   POST STATUS
=========================================================== */

function buildPostStatus(label,post){

    const status =
        String(
            post && post.status
                ? post.status
                : "NOT_SUBMITTED"
        ).toUpperCase();

    let statusClass =
        "adminPostPending";

    let statusText =
        "Not Submitted";

    if(status==="APPROVED"){

        statusClass =
            "adminPostApproved";

        statusText =
            "Approved";

    }

    else if(status==="PENDING"){

        statusClass =
            "adminPostPending";

        statusText =
            "Pending";

    }

    else if(status==="REJECTED"){

        statusClass =
            "adminPostRejected";

        statusText =
            "Rejected";

    }

    const link =
        post && post.link
            ? post.link
            : "";

    if(link){

        return `

            <a
                href="${escapeAttribute(link)}"
                target="_blank"
                rel="noopener noreferrer"
                class="adminPostStatus ${statusClass}">

                ${label} • ${statusText}

            </a>

        `;

    }

    return `

        <span class="adminPostStatus ${statusClass}">

            ${label} • ${statusText}

        </span>

    `;

}


/* ===========================================================
   EXPAND / COLLAPSE
=========================================================== */

function toggleCollege(header){

    const card =
        header.closest(
            ".collegeCard"
        );

    const body =
        card.querySelector(
            ".collegeBody"
        );

    const icon =
        header.querySelector(
            ".expandIcon"
        );

    const isOpen =
        card.classList.contains(
            "open"
        );

    document
        .querySelectorAll(
            ".collegeCard.open"
        )
        .forEach(openCard=>{

            if(openCard!==card){

                openCard.classList.remove(
                    "open"
                );
                const openIcon =
                    openCard.querySelector(
                        ".collegeHeader .expandIcon"
                    );
                if(openIcon){
                    openIcon.textContent="▼";
                }
           }
        });
    card.classList.toggle(
        "open",
        !isOpen
    );
    if(body){
        body.style.display =
            isOpen
                ? "none"
                : "block";
    }
    if(icon){
        icon.textContent =
            isOpen
                ? "▼"
                : "▲";
    }
}

/* ===========================================================
   CA EXPAND / COLLAPSE
=========================================================== */

function toggleAdminCA(header){

    const card =
        header.closest(
            ".adminCACard"
        );

    const body =
        card.querySelector(
            ".adminCABody"
        );

    const icon =
        header.querySelector(
            ".adminExpandIcon"
        );

    const isOpen =
        card.classList.contains(
            "open"
        );

    card.classList.toggle(
        "open",
        !isOpen
    );

    if(body){

        body.style.display =
            isOpen
                ? "none"
                : "block";

    }

    if(icon){

        icon.textContent =
            isOpen
                ? "▼"
                : "▲";

    }

}


/* ===========================================================
   SEARCH
=========================================================== */

const searchCollege =
    document.getElementById(
        "searchCollege"
    );

if(searchCollege){

    searchCollege.addEventListener(
        "input",
        function(){

            const query =
                this.value
                    .trim()
                    .toLowerCase();

            if(query===""){

                renderCollegeCards(
                    COLLEGES
                );

                return;

            }

            const filtered =
                COLLEGES.filter(college=>{

                    if(
                        String(
                            college.college || ""
                        )
                        .toLowerCase()
                        .includes(query)
                    ){

                        return true;

                    }

                    const lcaMatch =
                        (college.lcas || [])
                        .some(lca=>

                            String(
                                lca.name || ""
                            )
                            .toLowerCase()
                            .includes(query)

                        );

                    if(lcaMatch){

                        return true;

                    }

                    const caMatch =
                        (
                            college
                                .campusAmbassadors || []
                        )
                        .some(ca=>{

                            if(
                                String(
                                    ca.name || ""
                                )
                                .toLowerCase()
                                .includes(query)
                            ){

                                return true;

                            }

                            return (
                                ca.creators || []
                            )
                            .some(creator=>

                                String(
                                    creator.name || ""
                                )
                                .toLowerCase()
                                .includes(query)

                                ||

                                String(
                                    creator.instagram || ""
                                )
                                .toLowerCase()
                                .includes(query)

                            );

                        });

                    return caMatch;

                });

            renderCollegeCards(
                filtered
            );

        }
    );

}


/* ===========================================================
   OPEN DEACTIVATE MODAL
=========================================================== */

function openDeactivateModal(
    type,
    id,
    name
){

    CURRENT_TYPE =
        type;

    CURRENT_ID =
        id;

    CURRENT_NAME =
        name;

    const title =
        document.getElementById(
            "deactivateTitle"
        );

    const message =
        document.getElementById(
            "deactivateMessage"
        );

    const button =
        document.getElementById(
            "confirmDeactivateButton"
        );

    title.textContent =
        type==="CA"
            ? "Deactivate Campus Ambassador"
            : "Deactivate Creator";

    message.textContent =
        "Are you sure you want to deactivate " +
        name +
        "?";

    button.disabled =
        false;

    button.textContent =
        "Deactivate";

    document
        .getElementById(
            "deactivateModal"
        )
        .classList
        .remove(
            "hidden"
        );

}


/* ===========================================================
   CLOSE DEACTIVATE MODAL
=========================================================== */

function closeDeactivateModal(){

    CURRENT_TYPE =
        "";

    CURRENT_ID =
        "";

    CURRENT_NAME =
        "";

    const button =
        document.getElementById(
            "confirmDeactivateButton"
        );

    button.disabled =
        false;

    button.textContent =
        "Deactivate";

    document
        .getElementById(
            "deactivateModal"
        )
        .classList
        .add(
            "hidden"
        );

}
/* ===========================================================
   CONFIRM DEACTIVATION
=========================================================== */
async function confirmDeactivation(){

    if(
        !CURRENT_TYPE ||
        !CURRENT_ID
    ){

        return;

    }

    const button =
        document.getElementById(
            "confirmDeactivateButton"
        );

    button.disabled =
        true;

    button.textContent =
        "Deactivating...";

    try{

        let action = "";

        let parameter = "";

        if(CURRENT_TYPE==="CA"){

            action =
                "adminDeactivateCA";

            parameter =
                "&caUsername=" +
                encodeURIComponent(
                    CURRENT_ID
                );

        }

        else{

            action =
                "adminDeactivateCreator";

            parameter =
                "&creatorID=" +
                encodeURIComponent(
                    CURRENT_ID
                );

        }
        const response =
            await fetch(
                CONFIG.API_URL +
                "?action=" +
                action +
                "&adminUsername=" +
                encodeURIComponent(
                    SESSION.username
                ) +
                parameter
            );
        const data =
            await response.json();
        if(!data.success){
            button.disabled =
                false;
            button.textContent =
                "Deactivate";
            alert(
                data.message
            );
            return;
        }
        button.textContent =
            "Deactivated ✓";
        await new Promise(
            resolve=>
                setTimeout(
                    resolve,
                    800
              )
        );
        closeDeactivateModal();
        await loadDashboard();
    }
    catch(err){
        console.error(err);
        button.disabled =
            false;
        button.textContent =
            "Deactivate";
        alert(
            "Unable to deactivate."
        );
    }
}

/* ===========================================================
   HTML ESCAPING
=========================================================== */

function escapeHTML(value){

    return String(
        value === undefined ||
        value === null
            ? ""
            : value
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );
}
function escapeAttribute(value){
    return escapeHTML(
        value
    )
    .replace(
        /`/g,
        "&#096;"
    );
}
/* ===========================================================
   REFRESH BUTTON
=========================================================== */
async function refreshDashboard(){
    const button =
        document.getElementById(
            "refreshButton"
        );
    if(button){
        button.disabled =
            true;
        button.textContent =
            "Refreshing...";
    }
    await loadDashboard();
    if(button){
        button.disabled =
            false;
        button.textContent =
            "Refresh";
    }
}
/* ===========================================================
   MODAL OUTSIDE CLICK
=========================================================== */
window.addEventListener(
    "click",
    function(event){
        const modal =
            document.getElementById(
                "deactivateModal"
            );
        if(
            modal &&
            event.target === modal
        ){
            closeDeactivateModal();
        }
    }
);
/* ===========================================================
   ESCAPE KEY
=========================================================== */
document.addEventListener(
    "keydown",
    function(event){
        if(event.key==="Escape"){
            closeDeactivateModal();
        }
    }
);
/* ===========================================================
   PAGE VISIBILITY
=========================================================== */
document.addEventListener(
    "visibilitychange",
    function(){
        if(!document.hidden){
            resetSessionTimer();
        }
    }
);
/* ===========================================================
   AUTO REFRESH
=========================================================== */
setInterval(
    function(){
        if(
            SESSION &&
            SESSION.role==="ADMIN"
        ){
            loadDashboard();
        }
    },
    60000
);
