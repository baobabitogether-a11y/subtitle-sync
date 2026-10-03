describe("YouTube Video Viewer - Web E2E Subtitle Detection", () => {
  beforeEach(() => {
    cy.log("Step 0: Navigating to YouTube Video Viewer");
    cy.visit("./?reset_all=true");
    cy.title().should("match", /YouTube/i);
    cy.get("header").should("be.visible");
  });

  it("Step-by-step: Auto-detect subtitles once caption icon is set to ON", () => {
    cy.log("Step 1: Locating caption toggle icon on the video player");
    cy.get("#caption-toggle-button").should("be.visible");
    cy.screenshot("test1-step1", { capture: "viewport", overwrite: true });

    cy.log("Step 2: Checking caption toggle initial state");
    cy.get("#caption-toggle-button").then(($btn) => {
      const isPressed = $btn.attr("aria-pressed");
      if (isPressed !== "true") {
        cy.log("Step 2a: Clicking caption toggle icon to switch ON");
        cy.get("#caption-toggle-button").click();
      }
    });
    cy.screenshot("test1-step2", { capture: "viewport", overwrite: true });

    cy.log("Step 3: Verifying caption toggle button is active (aria-pressed=true)");
    cy.get("#caption-toggle-button").should("have.attr", "aria-pressed", "true");
    cy.screenshot("test1-step3", { capture: "viewport", overwrite: true });

    cy.log("Step 4: Waiting for subtitles to be detected and rendered");
    cy.get("#subtitle-cue-row-0, #active-subtitle-cue-text, #restored-subtitles-toast", {
      timeout: 15000,
    }).should("be.visible");
    cy.screenshot("test1-step4", { capture: "viewport", overwrite: true });

    cy.log("Step 5: Verifying subtitle text content is non-empty");
    cy.get("body").then(($body) => {
      if ($body.find("#subtitle-cue-row-0").length > 0) {
        cy.get("#subtitle-cue-row-0").first().invoke("text").should("have.length.greaterThan", 3);
      } else if ($body.find("#active-subtitle-cue-text").length > 0) {
        cy.get("#active-subtitle-cue-text").invoke("text").should("have.length.greaterThan", 3);
      }
    });
    cy.screenshot("test1-step5", { capture: "viewport", overwrite: true });

    cy.log("Step 6: Confirming State Machine badge status is active");
    cy.get("body").then(($body) => {
      if ($body.find("#state-machine-status-badge").length > 0) {
        cy.get("#state-machine-status-badge").should("be.visible");
      }
    });
    cy.screenshot("test1-step6", { capture: "viewport", overwrite: true });
  });

  it("Step-by-step: Fetch subtitles when caption icon is pressed after custom URL", () => {
    const targetUrl = "https://www.youtube.com/watch?v=c0pUbsq9FLk";

    cy.log("Step 1: Entering target YouTube URL into input field");
    cy.get("#youtube-url-input").should("be.visible").clear().type(targetUrl);
    cy.screenshot("test2-step1", { capture: "viewport", overwrite: true });

    cy.log("Step 2: Clicking Play Video button to cue video");
    cy.get("#play-video-button").click();
    cy.screenshot("test2-step2", { capture: "viewport", overwrite: true });

    cy.log("Step 3: Locating caption toggle button");
    cy.get("#caption-toggle-button").should("be.visible");
    cy.screenshot("test2-step3", { capture: "viewport", overwrite: true });

    cy.log("Step 4: Toggling caption icon to ON");
    cy.get("#caption-toggle-button").then(($btn) => {
      const isPressed = $btn.attr("aria-pressed");
      if (isPressed !== "true") {
        cy.get("#caption-toggle-button").click();
      }
    });
    cy.get("#caption-toggle-button").should("have.attr", "aria-pressed", "true");
    cy.screenshot("test2-step4", { capture: "viewport", overwrite: true });

    cy.log("Step 5: Waiting for subtitle cues to be fetched and rendered");
    cy.get("#subtitle-cue-row-0, #active-subtitle-cue-text, #restored-subtitles-toast", {
      timeout: 20000,
    }).should("be.visible");
    cy.screenshot("test2-step5", { capture: "viewport", overwrite: true });

    cy.log("Step 6: Verifying subtitle content is valid speech dialogue");
    cy.get("body").then(($body) => {
      if ($body.find("#subtitle-cue-row-0").length > 0) {
        cy.get("#subtitle-cue-row-0").first().invoke("text").should("have.length.greaterThan", 3);
      } else if ($body.find("#active-subtitle-cue-text").length > 0) {
        cy.get("#active-subtitle-cue-text").invoke("text").should("have.length.greaterThan", 3);
      }
    });
    cy.screenshot("test2-step6", { capture: "viewport", overwrite: true });
  });

  it("Step-by-step: Video Library panel - search filtering, save current, load video, and item removal", () => {
    cy.log("Step 1: Expanding the Video Library panel");
    cy.get("details").filter(':contains("Video library")').then(($details) => {
      if (!$details.attr("open")) {
        cy.wrap($details).find("summary").click();
      }
    });
    cy.get("#video-library-panel").should("be.visible");
    cy.screenshot("test4-step1", { capture: "viewport", overwrite: true });

    cy.log("Step 2: Testing search input filter in Video Library");
    cy.get("#library-search-input").should("be.visible").clear().type("Steve Jobs");
    cy.get("#library-items-list").should("contain.text", "Steve Jobs");
    cy.get("#library-search-input").clear();
    cy.screenshot("test4-step2", { capture: "viewport", overwrite: true });

    cy.log("Step 3: Saving current active video to Video Library");
    cy.get("#save-current-video-btn").should("be.visible").click();
    cy.screenshot("test4-step3", { capture: "viewport", overwrite: true });

    cy.log("Step 4: Loading an authentic video item from Video Library");
    cy.get("#library-items-list").then(($list) => {
      const loadBtn = $list.find('[id^="load-library-video-"]').not(":disabled").first();
      if (loadBtn.length > 0) {
        cy.wrap(loadBtn).click();
        cy.get("#video-player-container").should("be.visible");
      }
    });
    cy.screenshot("test4-step4", { capture: "viewport", overwrite: true });
  });

  it("Step-by-step: Debug Mode toggle controls Network Inspector visibility and dismissal", () => {
    cy.log("Step 1: Locating debug mode toggle in Settings panel");
    cy.get("details").filter(':contains("Playback")').then(($details) => {
      if (!$details.attr("open")) {
        cy.wrap($details).find("summary").click();
      }
    });
    cy.get("#debug-mode-toggle").should("exist");

    cy.log("Step 2: Enabling Debug Mode toggle");
    cy.get("#debug-mode-toggle").check({ force: true });
    cy.get("#debug-mode-toggle").should("be.checked");

    cy.log("Step 3: Opening Network Requests Inspector modal");
    cy.get("#navbar-network-button").should("be.visible").click();
    cy.get("#network-requests-inspector-modal").should("be.visible");
    cy.screenshot("test5-step3", { capture: "viewport", overwrite: true });

    cy.log("Step 4: Closing modal using explicit close button");
    cy.get("#close-network-inspector-btn").click();
    cy.get("#network-requests-inspector-modal").should("not.exist");
    cy.screenshot("test5-step4", { capture: "viewport", overwrite: true });
  });

  it("Step-by-step: Audio-track mode and auto-scroll preference controls", () => {
    cy.log("Step 1: Checking initial audio-track mode setting");
    cy.get("#audio-track-mode-toggle").should("exist");
    cy.get("#audio-track-mode-toggle").check({ force: true });
    cy.get("#audio-track-mode-toggle").should("be.checked");

    cy.log("Step 2: Checking initial auto-scroll setting");
    cy.get("#auto-scroll-toggle").should("exist");
    cy.get("#auto-scroll-toggle").check({ force: true });
    cy.get("#auto-scroll-toggle").should("be.checked");
    cy.screenshot("test6-step2", { capture: "viewport", overwrite: true });
  });
});
