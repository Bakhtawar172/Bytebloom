// ===== STATE MODULE =====
let courses = [...fallbackCourses];
let cart = loadCart();

// ===== STORAGE MODULE (bonus: cart survives refresh) =====
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("bytebloomCart")) || [];
  } catch (error) {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("bytebloomCart", JSON.stringify(cart));
}

// ===== HELPER MODULE =====
function formatPrice(amount) {
  return "$" + amount.toFixed(2);
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// ===== DISPLAY MODULE =====
function createCardHTML(course) {
  const stockText = course.inStock ? "In stock" : "Sold out";
  const stockClass = course.inStock ? "in-stock" : "out-stock";
  const hasPanel = document.getElementById("details-panel") !== null;
  const detailsButton = hasPanel
    ? `<button class="btn btn-outline details-btn" data-id="${course.id}">Details</button>`
    : "";

  return `
    <article class="card">
      <img src="images/${course.category}.svg" alt="${course.name} course icon">
      <h3>${course.name}</h3>
      <p class="meta">${capitalize(course.category)} | ${course.level}</p>
            <p class="desc">${course.description}</p>
      <p class="meta">Rating: ${course.rating} / 5</p>
      <span class="badge ${stockClass}">${stockText}</span>
      <div class="card-footer">
        <span class="price">${formatPrice(course.price)}</span>
        <div class="card-actions">
          ${detailsButton}
          <button class="btn add-btn" data-id="${course.id}" ${course.inStock ? "" : "disabled"}>Add</button>
        </div>
      </div>
    </article>`;
}

function renderCourses(list, containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.innerHTML = list.length
    ? list.map(course => createCardHTML(course)).join("")
    : "<p>No courses match your search.</p>";
  animateCards(); // jQuery fade-in (written in ui.js)
}

// ===== SEARCH, FILTER AND SORT MODULE =====
function getVisibleCourses() {
  const searchText = document.getElementById("search").value.trim().toLowerCase();
  const category = document.getElementById("category").value;
  const sortBy = document.getElementById("sort").value;

  // filter(): keep courses that match the search text AND the category
  const filtered = courses.filter(course =>
    course.name.toLowerCase().includes(searchText) &&
    (category === "all" || course.category === category)
  );

  // sort(): copy first with spread so the original array is never changed
  const sorted = [...filtered];
  if (sortBy === "price-low") sorted.sort((a, b) => a.price - b.price);
  if (sortBy === "price-high") sorted.sort((a, b) => b.price - a.price);
  if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === "rating") sorted.sort((a, b) => b.rating - a.rating);
  return sorted;
}

function refreshCourses() {
  const list = getVisibleCourses();
  renderCourses(list, "product-grid");
  document.getElementById("result-count").textContent =
    `Showing ${list.length} of ${courses.length} courses`;
}

function getTopRated(howMany) {
  return [...courses].sort((a, b) => b.rating - a.rating).slice(0, howMany);
}

// ===== DETAILS MODULE =====
function showDetails(id) {
  // find(): returns the FIRST course whose id matches
  const course = courses.find(item => item.id === id);
  const panel = document.getElementById("details-panel");
  if (!course || !panel) return;

  // build one <li> for each topic in the course
  const topicItems = (course.topics || []).map(topic => `<li>${topic}</li>`).join("");

  panel.innerHTML = `
    <button class="close-btn" data-action="close" aria-label="Close details">&times;</button>
    <h3>${course.name}</h3>
    <p>${course.description}</p>
    <p><strong>Category:</strong> ${capitalize(course.category)} &nbsp; <strong>Level:</strong> ${course.level} &nbsp; <strong>Duration:</strong> ${course.duration}</p>
    <p><strong>Rating:</strong> ${course.rating} / 5 &nbsp; <strong>Fee:</strong> ${formatPrice(course.price)} &nbsp; <strong>Status:</strong> ${course.inStock ? "Seats available" : "Sold out"}</p>
    <h4>What you will learn</h4>
    <ul>${topicItems}</ul>
    <button class="btn add-btn" data-id="${course.id}" ${course.inStock ? "" : "disabled"}>Add to cart</button>`;
  revealPanel(); // jQuery fade-in (ui.js)
}

// ===== CART MODULE =====
function addToCart(id) {
  const course = courses.find(item => item.id === id);
  if (!course || !course.inStock) return;

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: id, qty: 1 });
  }
  cartChanged(`${course.name} added to cart`);
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  cartChanged("Course removed from cart");
}

function changeQty(id, amount) {
  const item = cart.find(entry => entry.id === id);
  if (!item) return;
  item.qty += amount;
  if (item.qty <= 0) {
    removeFromCart(id);
  } else {
    cartChanged();
  }
}

// Rest parameter: ...ids collects any number of arguments into an array
function addMany(...ids) {
  ids.forEach(id => addToCart(id));
  showToast(`${ids.length} courses added to cart`);
}

function cartChanged(message) {
  saveCart();
  updateCartBadge();
  renderCart();
  if (message) showToast(message);
}

// reduce() adds everything into ONE number. The starting value is 0.
function calculateTotals() {
  const subtotal = cart.reduce((sum, item) => {
    const course = courses.find(c => c.id === item.id);
    return course ? sum + course.price * item.qty : sum;
  }, 0);
  const discount = subtotal > 200 ? subtotal * 0.1 : 0; // 10% off above $200
  return { subtotal: subtotal, discount: discount, total: subtotal - discount };
}

function renderCart() {
  const body = document.getElementById("cart-body");
  if (!body) return; // this page has no cart table

  body.innerHTML = cart.map(item => {
    const course = courses.find(c => c.id === item.id);
    if (!course) return "";
    return `
      <tr>
        <td>${course.name}</td>
        <td>${formatPrice(course.price)}</td>
        <td>
          <button class="qty-btn" data-action="minus" data-id="${course.id}" aria-label="Decrease quantity">-</button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-action="plus" data-id="${course.id}" aria-label="Increase quantity">+</button>
        </td>
        <td>${formatPrice(course.price * item.qty)}</td>
        <td><button class="btn" data-action="remove" data-id="${course.id}">Remove</button></td>
      </tr>`;
  }).join("");

  document.getElementById("empty-msg").hidden = cart.length > 0;

  const totals = calculateTotals();
  document.getElementById("subtotal").textContent = formatPrice(totals.subtotal);
  document.getElementById("discount").textContent = "-" + formatPrice(totals.discount);
  document.getElementById("grand-total").textContent = formatPrice(totals.total);
}

// ===== EVENT HANDLERS (event delegation) =====
// ONE listener on the parent catches clicks on buttons that JavaScript
// created later. e.target tells us which button was clicked.
function handleCourseClick(e) {
  const button = e.target.closest("button");
  if (!button) return;
  const id = Number(button.dataset.id);

  if (button.classList.contains("add-btn")) addToCart(id);
  else if (button.classList.contains("details-btn")) showDetails(id);
  else if (button.dataset.action === "close") {
    document.getElementById("details-panel").innerHTML = "";
  }
}

function handleCartClick(e) {
  const button = e.target.closest("button");
  if (!button) return;
  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === "plus") changeQty(id, 1);
  else if (action === "minus") changeQty(id, -1);
  else if (action === "remove") removeFromCart(id);
}

function setupEvents() {
  const grid = document.getElementById("product-grid");
  const featured = document.getElementById("featured-grid");
  const panel = document.getElementById("details-panel");
  const cartBody = document.getElementById("cart-body");
  const bundleButton = document.getElementById("bundle-btn");
  const checkoutForm = document.getElementById("checkout-form");

  if (grid) grid.addEventListener("click", handleCourseClick);
  if (featured) featured.addEventListener("click", handleCourseClick);
  if (panel) panel.addEventListener("click", handleCourseClick);
  if (cartBody) cartBody.addEventListener("click", handleCartClick);

  if (grid) {
    document.getElementById("search").addEventListener("input", refreshCourses);
    document.getElementById("category").addEventListener("change", refreshCourses);
    document.getElementById("sort").addEventListener("change", refreshCourses);
  }

  if (bundleButton) {
    bundleButton.addEventListener("click", () => addMany(1, 5, 9));
  }

  if (checkoutForm) checkoutForm.addEventListener("submit", handleCheckoutSubmit);
}

// ===== FORM VALIDATION MODULE =====
function check(input, errorId, isValid, message) {
  document.getElementById(errorId).textContent = isValid ? "" : message;
  markField(input, isValid); // ui.js
  return isValid;
}

function validateCheckout() {
  const nameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const seatsInput = document.getElementById("seats");
  const paymentInput = document.getElementById("payment");
  const termsInput = document.getElementById("terms");
  const modeInput = document.getElementById("mode-online");
  const modeChosen = document.querySelector('input[name="mode"]:checked') !== null;
  let valid = true;

  const nameText = nameInput.value.trim();
  if (!check(nameInput, "err-name", nameText.length >= 3 && /^[A-Za-z ]+$/.test(nameText),
    "Enter at least 3 letters. Use letters and spaces only.")) valid = false;

  if (!check(emailInput, "err-email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()),
    "Enter a valid email, for example name@example.com.")) valid = false;

  if (!check(phoneInput, "err-phone", /^[0-9]{11}$/.test(phoneInput.value.trim()),
    "Enter exactly 11 digits, for example 03001234567.")) valid = false;

  const seats = Number(seatsInput.value);
  if (!check(seatsInput, "err-seats", Number.isInteger(seats) && seats >= 1 && seats <= 10,
    "Choose between 1 and 10 seats.")) valid = false;

  if (!check(paymentInput, "err-payment", paymentInput.value !== "",
    "Choose a payment method.")) valid = false;

  if (!check(modeInput, "err-mode", modeChosen,
    "Choose online or on site.")) valid = false;

  if (!check(termsInput, "err-terms", termsInput.checked,
    "You must accept the terms to continue.")) valid = false;

  const cartError = document.getElementById("err-cart");
  if (cart.length === 0) {
    cartError.textContent = "Your cart is empty. Add a course before placing an order.";
    valid = false;
  } else {
    cartError.textContent = "";
  }

  return valid;
}

function handleCheckoutSubmit(e) {
  if (!validateCheckout()) {
    e.preventDefault(); // invalid: stop the submission
    return;
  }
  e.preventDefault(); // valid: no back end, so we finish the order here
  completeOrder();
}

function completeOrder() {
  cart = [];
  saveCart();
  updateCartBadge();
  renderCart();
  document.getElementById("checkout-form").reset();
  showSuccess("Thank you! Your order has been placed."); // ui.js
}

// ===== PAGE START =====
// Called from ui.js after products.json has loaded (or failed)
function initPage(page) {
  if (page === "home") renderCourses(getTopRated(4), "featured-grid");
  if (page === "courses") refreshCourses();
  if (page === "cart") renderCart();
}

setupEvents();