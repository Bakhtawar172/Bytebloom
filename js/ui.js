// ===== HELPER FUNCTIONS USED BY store.js =====

// .text() updates the number in the navigation bar
function updateCartBadge() {
  const totalItems = cart.reduce((count, item) => count + item.qty, 0);
  $("#cart-badge").text(totalItems);
}

// Notification: METHOD CHAINING (many methods joined on one element)
function showToast(message) {
  $("#toast").stop(true, true).text(message).fadeIn(200).delay(1500).fadeOut(400);
}

// Course cards fade in when they appear
function animateCards() {
  $(".card").hide().fadeIn(400);
}

// Details panel fades in
function revealPanel() {
  $("#details-panel").hide().fadeIn(300);
}

// .addClass / .removeClass highlight invalid fields; .animate shakes them
function markField(input, isValid) {
  const $field = $(input);
  if (isValid) {
    $field.removeClass("invalid");
  } else {
    $field.addClass("invalid")
      .stop(true, true)
      .animate({ left: "-6px" }, 60)
      .animate({ left: "6px" }, 60)
      .animate({ left: "0px" }, 60);
  }
}

// .remove() deletes the message again after a few seconds
function showSuccess(message) {
  $(".success").remove();
  $("<p>").addClass("success").text(message).appendTo("#checkout-form")
    .delay(4000).fadeOut(400, function () { $(this).remove(); });
}

// ===== MAIN jQuery CODE =====
$(document).ready(function () {

  const page = $("body").data("page"); // reads data-page="home" etc.
  updateCartBadge();

  // ----- 1. AJAX: load courses from products.json -----
  if (page === "home" || page === "courses" || page === "cart") {
    $("#message").removeClass("error-msg").text("Loading courses...");

    $.getJSON("products.json")
      .done(function (data) {
        courses = data;
        $("#message").text("");
      })
      .fail(function () {
        $("#message")
          .addClass("error-msg")
          .text("Could not load products.json. Showing the saved course list instead.");
      })
      .always(function () {
        initPage(page);
        updateCartBadge();
      });
  }

  // ----- 2. FAQ accordion (slideToggle effect) -----
  $(".faq-question").on("click", function () {
    $(this).next(".faq-answer").slideToggle(250);
  });

  // ----- 3. Mobile menu (toggleClass) -----
  $("#menu-toggle").on("click", function () {
    $("#nav-links").toggleClass("open");
  });

  // ----- 4. Back-to-top button (fade + animate) -----
  $(window).on("scroll", function () {
    if ($(this).scrollTop() > 300) {
      $("#back-to-top").fadeIn(200);
    } else {
      $("#back-to-top").fadeOut(200);
    }
  });

  $("#back-to-top").on("click", function () {
    $("html, body").animate({ scrollTop: 0 }, 500);
  });

  // ----- 5. Contact form: .val() reads input, .appendTo() adds a message -----
  $("#contact-form").on("submit", function (e) {
    e.preventDefault();
    const name = $("#contact-name").val().trim();
    showToast("Thanks, " + name + "! We will reply soon.");
    $("<p>").addClass("success").text("Message sent. Check your email for our reply.")
      .appendTo(this).delay(3000).fadeOut(400, function () { $(this).remove(); });
    this.reset();
  });

  // ----- 6. Remove red highlight when the user types again -----
  $("#checkout-form").on("input change", "input, select, textarea", function () {
    $(this).removeClass("invalid");
  });

});