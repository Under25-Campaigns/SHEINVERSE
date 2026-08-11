let SESSION = null;

let COLLEGES = [];

let CURRENT_TYPE = "";

let CURRENT_ID = "";

let CURRENT_NAME = "";


/* ===========================================================
   ADMIN UI STATE
=========================================================== */

let ADMIN_UI_STATE = {

    searchQuery: "",

    openCollege: "",

    openCA: "",

    scrollY: 0

};


/* ===========================================================
   INITIALIZE
=========================================================== */

window.addEventListener("load", () => {

    validateSession();

});


/* ===========================================================
   SESSION
=========================================================== */

function validateSession(){

    const raw =
        localStorage.getItem("SHEIN_SESSION");

    if(!raw){

        location.href = "index.html";

        return;

    }

    SESSION =
        JSON.parse(raw);

    if(SESSION.role !== "ADMIN"){

        location.href = "index.html";

        return;

    }

    document
        .getElementById("welcomeText")
        .innerHTML =
        "Welcome, " + SESSION.name;

    startSessionTimer();

    loadDashboard();

}


function logout(){

    localStorage.removeItem(
        "SHEIN_SESSION"
    );

    location.href =
        "index.html";

}


/* ===========================================================
   AUTO LOGOUT
=========================================================== */

const SESSION_TIMEOUT =
    15 * 60 * 1000;

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
    ].forEach(event => {

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

    inactivityTimer =
        setTimeout(() => {

            alert(
                "Your session has expired."
            );

            logout();

        }, SESSION_TIMEOUT);

}


/* ===========================================================
   CAPTURE ADMIN STATE
=========================================================== */

function captureAdminUIState(){

    const searchInput =
        document.getElementById(
            "searchCollege"
        );

    if(searchInput){

        ADMIN_UI_STATE.searchQuery =
            searchInput.value;

    }

    const openCollege =
        document.querySelector(
            ".collegeCard.open"
        );

    ADMIN_UI_STATE.openCollege =
        openCollege
            ? String(
                openCollege.dataset.collegeName || ""
            )
            : "";

    const openCA =
        document.querySelector(
            ".adminCACard.open"
        );

    ADMIN_UI_STATE.openCA =
        openCA
            ? String(
                openCA.dataset.caUsername || ""
            )
            : "";

    ADMIN_UI_STATE.scrollY =
        window.scrollY || 0;

}

/* ===========================================================
   LOAD DASHBOARD
=========================================================== */

async function loadDashboard(){

    /*
        IMPORTANT:
        Capture the current search / expanded cards / scroll
        BEFORE fetching fresh dashboard data.
    */

    captureAdminUIState();

    try{

        const response =
            await fetch(

                CONFIG.API_URL +

                "?action=getAdminDashboard" +

                "&adminUsername=" +

                encodeURIComponent(
                    SESSION.username
                ) +

                "&t=" +

                Date.now()

            );

        const data =
            await response.json();


        if(!data.success){

            alert(
                data.message
            );

            return;

        }


        COLLEGES =
            Array.isArray(data.colleges)
                ? data.colleges
                : [];


        renderOverview(
            data.overview || {}
        );


        /*
            DO NOT simply call:

            renderCollegeCards(COLLEGES);

            We render using the current search state instead.
        */

        renderCurrentAdminView();

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

    const activeLCAs =
        document.getElementById(
            "activeLCAs"
        );

    if(activeLCAs){

        activeLCAs.innerHTML =
            Number(
                overview.activeLCAs || 0
            ).toLocaleString();

    }


    const activeCAs =
        document.getElementById(
            "activeCAs"
        );

    if(activeCAs){

        activeCAs.innerHTML =
            Number(
                overview.activeCAs || 0
            ).toLocaleString();

    }


    const activeCreators =
        document.getElementById(
            "activeCreators"
        );

    if(activeCreators){

        activeCreators.innerHTML =
            Number(
                overview.activeCreators || 0
            ).toLocaleString();

    }


    const approvedReels =
        document.getElementById(
            "approvedReels"
        );

    if(approvedReels){

        approvedReels.innerHTML =
            Number(
                overview.approvedReels || 0
            ).toLocaleString();

    }


    /*
        Your dashboard previously used
        approvedCarousels.

        We are keeping the ID here so this
        does NOT break your existing HTML.

        It can visually say "Reel 2" in the HTML.
    */

    const approvedCarousels =
        document.getElementById(
            "approvedCarousels"
        );

    if(approvedCarousels){

        approvedCarousels.innerHTML =
            Number(
                overview.approvedCarousels || 0
            ).toLocaleString();

    }


    const totalReferrals =
        document.getElementById(
            "totalReferrals"
        );

    if(totalReferrals){

        totalReferrals.innerHTML =
            Number(
                overview.totalReferrals || 0
            ).toLocaleString();

    }

}


/* ===========================================================
   FILTER COLLEGES
=========================================================== */

function getFilteredColleges(query){

    const normalizedQuery =
        String(
            query || ""
        )
        .trim()
        .toLowerCase();


    if(
        normalizedQuery === ""
    ){

        return COLLEGES;

    }


    return COLLEGES.filter(
        college => {

            /*
                COLLEGE NAME
            */

            const collegeMatch =
                String(
                    college.college || ""
                )
                .toLowerCase()
                .includes(
                    normalizedQuery
                );

            if(collegeMatch){

                return true;

            }


            /*
                LCA NAME
            */

            const lcaMatch =
                (
                    college.lcas || []
                )
                .some(
                    lca =>

                        String(
                            lca.name || ""
                        )
                        .toLowerCase()
                        .includes(
                            normalizedQuery
                        )

                );

            if(lcaMatch){

                return true;

            }


            /*
                CA / CREATOR SEARCH
            */

            return (
                college.campusAmbassadors || []
            )
            .some(
                ca => {

                    /*
                        CA NAME
                    */

                    const caNameMatch =
                        String(
                            ca.name || ""
                        )
                        .toLowerCase()
                        .includes(
                            normalizedQuery
                        );

                    if(caNameMatch){

                        return true;

                    }


                    /*
                        CA USERNAME
                    */

                    const caUsernameMatch =
                        String(
                            ca.username || ""
                        )
                        .toLowerCase()
                        .includes(
                            normalizedQuery
                        );

                    if(caUsernameMatch){

                        return true;

                    }


                    /*
                        CREATOR
                    */

                    return (
                        ca.creators || []
                    )
                    .some(
                        creator => {

                            const creatorName =
                                String(
                                    creator.name || ""
                                )
                                .toLowerCase();

                            const instagram =
                                String(
                                    creator.instagram || ""
                                )
                                .replace(
                                    /^@/,
                                    ""
                                )
                                .toLowerCase();

                            const cleanSearch =
                                normalizedQuery
                                .replace(
                                    /^@/,
                                    ""
                                );

                            return (

                                creatorName.includes(
                                    normalizedQuery
                                )

                                ||

                                instagram.includes(
                                    cleanSearch
                                )

                            );

                        }
                    );

                }
            );

        }
    );

}


/* ===========================================================
   RENDER CURRENT VIEW
=========================================================== */

function renderCurrentAdminView(){

    const filtered =
        getFilteredColleges(
            ADMIN_UI_STATE.searchQuery
        );


    renderCollegeCards(
        filtered
    );


    /*
        Once the HTML has been rebuilt,
        reopen the cards that were previously open.
    */

    restoreAdminUIState();

}


/* ===========================================================
   RESTORE ADMIN STATE
=========================================================== */

function restoreAdminUIState(){

    /*
        RESTORE SEARCH
    */

    const searchInput =
        document.getElementById(
            "searchCollege"
        );

    if(searchInput){

        searchInput.value =
            ADMIN_UI_STATE.searchQuery || "";

    }


    /*
        RESTORE COLLEGE
    */

    if(
        ADMIN_UI_STATE.openCollege
    ){

        document
            .querySelectorAll(
                ".collegeCard"
            )
            .forEach(
                card => {

                    const collegeName =
                        String(
                            card.dataset.collegeName || ""
                        );

                    if(
                        collegeName !==
                        ADMIN_UI_STATE.openCollege
                    ){

                        return;

                    }


                    card.classList.add(
                        "open"
                    );


                    const body =
                        card.querySelector(
                            ".collegeBody"
                        );

                    if(body){

                        body.style.display =
                            "block";

                    }


                    const icon =
                        card.querySelector(
                            ".collegeHeader .expandIcon"
                        );

                    if(icon){

                        icon.textContent =
                            "▲";

                    }

                }
            );

    }


    /*
        RESTORE CA
    */

    if(
        ADMIN_UI_STATE.openCA
    ){

        document
            .querySelectorAll(
                ".adminCACard"
            )
            .forEach(
                card => {

                    const username =
                        String(
                            card.dataset.caUsername || ""
                        );

                    if(
                        username !==
                        ADMIN_UI_STATE.openCA
                    ){

                        return;

                    }


                    card.classList.add(
                        "open"
                    );


                    const body =
                        card.querySelector(
                            ".adminCABody"
                        );

                    if(body){

                        body.style.display =
                            "block";

                    }


                    const icon =
                        card.querySelector(
                            ".adminExpandIcon"
                        );

                    if(icon){

                        icon.textContent =
                            "▲";

                    }

                }
            );

    }


    /*
        RESTORE SCROLL POSITION

        Two animation frames are intentional.

        First frame:
        browser finishes rendering cards.

        Second frame:
        scroll back to the previous position.
    */

    const savedScroll =
        Number(
            ADMIN_UI_STATE.scrollY || 0
        );


    requestAnimationFrame(
        () => {

            requestAnimationFrame(
                () => {

                    window.scrollTo(
                        0,
                        savedScroll
                    );

                }
            );

        }
    );

}


/* ===========================================================
   SEARCH EVENT
=========================================================== */

function initializeAdminSearch(){

    const searchInput =
        document.getElementById(
            "searchCollege"
        );


    if(!searchInput){

        return;

    }


    searchInput.addEventListener(
        "input",
        function(){

            /*
                Store the actual search immediately.
            */

            ADMIN_UI_STATE.searchQuery =
                this.value;


            /*
                When searching, don't preserve the old
                scroll position.

                Otherwise the browser can jump down to
                where the admin was before the search.
            */
            ADMIN_UI_STATE.scrollY =
                0;
            renderCurrentAdminView();
        }
    );
}


/*
    Initialize search once the DOM exists.
*/
if(
    document.readyState ===
    "loading"
){
    document.addEventListener(
        "DOMContentLoaded",
        initializeAdminSearch
    );
}
else{
    initializeAdminSearch();
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

    container.innerHTML = "";

    if(!colleges.length){

        container.innerHTML = `

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

        const collegeCard =
            node.querySelector(
                ".collegeCard"
            );

        if(collegeCard){

            collegeCard.dataset.collegeName =
                String(
                    college.college || ""
                );

        }

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

    let html = "";

    const lcas =
        Array.isArray(college.lcas)
            ? college.lcas
            : [];

    if(lcas.length){

        html += `

            <div class="adminLCASection">

                <div class="adminSectionLabel">

                    Lead Campus Ambassador

                </div>

        `;

        lcas.forEach(lca=>{

            html += `

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

        html += `

            </div>

        `;

    }

    html += `

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

    let html = "";

    campusAmbassadors.forEach(ca=>{

        html += `

            <div
                class="adminCACard"
                data-ca-username="${escapeAttribute(
                    ca.username
                )}">

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

    let html = "";

    creators.forEach(creator=>{

        html += `

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
                        "Reel 1",
                        creator.reel
                    )}

                    ${buildPostStatus(
                        "Reel 2",
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

function buildPostStatus(
    label,
    post
){

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

    if(status === "APPROVED"){

        statusClass =
            "adminPostApproved";

        statusText =
            "Approved";

    }

    else if(status === "PENDING"){

        statusClass =
            "adminPostPending";

        statusText =
            "Pending";

    }

    else if(status === "REJECTED"){

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

        <span
            class="adminPostStatus ${statusClass}">

            ${label} • ${statusText}

        </span>

    `;

}


/* ===========================================================
   EXPAND / COLLAPSE - COLLEGE
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


    /*
        Keep only one college open at a time.
    */

    document
        .querySelectorAll(
            ".collegeCard.open"
        )
        .forEach(openCard=>{

            if(openCard === card){

                return;

            }

            openCard.classList.remove(
                "open"
            );

            const openBody =
                openCard.querySelector(
                    ".collegeBody"
                );

            if(openBody){

                openBody.style.display =
                    "none";

            }

            const openIcon =
                openCard.querySelector(
                    ".collegeHeader .expandIcon"
                );

            if(openIcon){

                openIcon.textContent =
                    "▼";

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


    /*
        Save exactly which college is open.
    */

    ADMIN_UI_STATE.openCollege =
        isOpen
            ? ""
            : String(
                card.dataset.collegeName || ""
            );


    /*
        If college is closed,
        its CA cannot remain open in state.
    */

    if(isOpen){

        ADMIN_UI_STATE.openCA =
            "";

    }

}


/* ===========================================================
   EXPAND / COLLAPSE - CA
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


    /*
        Keep one CA open at a time
        inside the currently open college.
    */

    const collegeCard =
        card.closest(
            ".collegeCard"
        );

    if(collegeCard){

        collegeCard
            .querySelectorAll(
                ".adminCACard.open"
            )
            .forEach(openCard=>{

                if(openCard === card){

                    return;

                }

                openCard.classList.remove(
                    "open"
                );

                const openBody =
                    openCard.querySelector(
                        ".adminCABody"
                    );

                if(openBody){

                    openBody.style.display =
                        "none";

                }

                const openIcon =
                    openCard.querySelector(
                        ".adminExpandIcon"
                    );

                if(openIcon){

                    openIcon.textContent =
                        "▼";

                }

            });

    }


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


    ADMIN_UI_STATE.openCA =
        isOpen
            ? ""
            : String(
                card.dataset.caUsername || ""
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
        type === "CA"
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

    /*
        Capture state BEFORE deactivation.
        This is the critical part.
    */

    const searchInput =
        document.getElementById(
            "searchCollege"
        );

    if(searchInput){

        ADMIN_UI_STATE.searchQuery =
            searchInput.value;

    }

    ADMIN_UI_STATE.scrollY =
        window.scrollY || 0;


    const button =
        document.getElementById(
            "confirmDeactivateButton"
        );

    button.disabled =
        true;

    button.textContent =
        "Deactivating...";


    try{

        let action =
            "";

        let parameter =
            "";


        if(
            CURRENT_TYPE === "CA"
        ){

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

                parameter +

                "&t=" +
                Date.now()

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
            resolve =>
                setTimeout(
                    resolve,
                    800
                )
        );


        /*
            IMPORTANT:
            closeDeactivateModal() resets CURRENT_ID etc.,
            but DOES NOT touch ADMIN_UI_STATE.
        */

        closeDeactivateModal();


        /*
            Reload fresh backend data.

            loadDashboard() will:
            - fetch new data
            - preserve current search
            - rerender filtered results
            - restore the open college/CA
            - restore scroll position
        */

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


    /*
        Preserve state before manual refresh.
    */

    captureAdminUIState();


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

        if(
            event.key === "Escape"
        ){

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
    async function(){

        if(
            !SESSION ||
            SESSION.role !== "ADMIN"
        ){

            return;

        }


        /*
            If a deactivation modal is currently open,
            don't refresh underneath the admin.

            Otherwise the DOM can rebuild while they're
            trying to confirm an action.
        */

        const deactivateModal =
            document.getElementById(
                "deactivateModal"
            );

        if(
            deactivateModal &&
            !deactivateModal.classList.contains(
                "hidden"
            )
        ){

            return;

        }


        /*
            Preserve search / expanded cards / scroll
            before automatic refresh.
        */

        captureAdminUIState();


        await loadDashboard();

    },

    60000
);
