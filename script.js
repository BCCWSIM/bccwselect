document.addEventListener('DOMContentLoaded', (event) => {
    var uniqueCodeElement = document.getElementById('uniqueCode');
    var uniqueCode = generateUniqueCode();
    uniqueCodeElement.textContent = uniqueCode;
});

function generateUniqueCode() {
    var timestamp = Date.now();
    var yearEndNumber = new Date().getFullYear().toString().substr(-1);
    var mapping = {0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G', 7: 'H', 8: 'I', 9: 'J'};
    var secondChar = mapping[yearEndNumber];
    var randomNum = Math.floor(Math.random() * 10000);
    return 'E' + secondChar + randomNum.toString().padStart(4, '0');
}

window.onbeforeunload = () => window.scrollTo(0, 0);

let items = [];
let headers;
let skuIndex;
let selectedItems = new Set();
let categoryIndex; // Declare categoryIndex in an outer scope
let subcategoryIndex; // Declare subcategoryIndex in an outer scope

// Use the raw GitHub URL to fetch the CSV file
fetch('https://raw.githubusercontent.com/BCCWSIM/bccwselect/main/Resources.csv')
    .then(response => response.text())
    .then(csvData => {
        items = csvData.split('\n').filter(row => row.length > 0).map(row => row.split(','));
        headers = items;
        skuIndex = headers.indexOf('SKU');
        categoryIndex = headers.indexOf('Category'); // Get the index of the 'Category' column
        subcategoryIndex = headers.indexOf('Subcategory'); // Get the index of the 'Subcategory' column

        const categories = new Set(items.slice(1).map(item => item[categoryIndex]));
        const subcategories = new Set(items.slice(1).map(item => item[subcategoryIndex]));

        const galleryContainer = document.getElementById('galleryContainer');
        const categorySelect = createDropdown('categorySelect', categories);
        const subcategorySelect = createDropdown('subcategorySelect', subcategories);        

        categorySelect.addEventListener('change', displayGallery);
        subcategorySelect.addEventListener('change', displayGallery);

        // Create labels for the dropdowns
        const categoryLabel = document.createElement('label');
        categoryLabel.textContent = 'Category:';
        categoryLabel.htmlFor = 'categorySelect';

        const subcategoryLabel = document.createElement('label');
        subcategoryLabel.textContent = 'Subcategory:';
        subcategoryLabel.htmlFor = 'subcategorySelect';

        // Insert labels and dropdowns
        galleryContainer.insertBefore(categoryLabel, galleryContainer.firstChild);
        galleryContainer.insertBefore(categorySelect, categoryLabel.nextSibling);
        galleryContainer.insertBefore(subcategoryLabel, categorySelect.nextSibling);
        galleryContainer.insertBefore(subcategorySelect, subcategoryLabel.nextSibling);

        displayGallery(items);
        document.getElementById('csvGallery').style.display = 'flex';
    })
    .catch(error => console.error('Error fetching CSV:', error));

function createDropdown(id, options) {
    const select = document.createElement('select');
    select.id = id;

    // Add an "All" option to the dropdown
    const allOption = document.createElement('option');
    allOption.value = 'All';
    allOption.textContent = 'All';
    select.appendChild(allOption);

    options.forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        select.appendChild(option);
    });

    return select;
}

// Update displayGallery function
function displayGallery() {
    const selectedCategory = document.getElementById('categorySelect').value;
    let selectedSubcategory = document.getElementById('subcategorySelect').value;

    // Filter subcategories based on selected category
    let filteredSubcategories = new Set();
    if (selectedCategory !== 'All') {
        for (let i = 1; i < items.length; i++) {
            if (items[i][categoryIndex] === selectedCategory) {
                filteredSubcategories.add(items[i][subcategoryIndex]);
            }
        }
    } else {
        filteredSubcategories = new Set(items.slice(1).map(item => item[subcategoryIndex]));
    }

    // Update subcategory dropdown options
    const subcategorySelect = document.getElementById('subcategorySelect');
    subcategorySelect.innerHTML = '';
    subcategorySelect.appendChild(createOption('All'));
    filteredSubcategories.forEach(subcategory => {
        subcategorySelect.appendChild(createOption(subcategory));
    });

    // Restore the selected subcategory
    if (Array.from(filteredSubcategories).includes(selectedSubcategory)) {
        subcategorySelect.value = selectedSubcategory;
    } else {
        selectedSubcategory = 'All';
    }

    // Display gallery
    const gallery = document.getElementById('csvGallery');
    gallery.innerHTML = '';
    for (let i = 1; i < items.length; i++) {
        // Display all items if "All" is selected, otherwise only display items that match the selected category and subcategory
        if ((selectedCategory === 'All' || items[i][categoryIndex] === selectedCategory) &&
            (selectedSubcategory === 'All' || items[i][subcategoryIndex] === selectedSubcategory)) {
            const div = createCard(items[i]);
            gallery.appendChild(div);
        }
    }
}

// Create option for dropdown
function createOption(value) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    return option;
}

// Add reset button
const resetButton = document.createElement('button');
resetButton.textContent = 'Reset';
resetButton.style.display = 'block'; // Add this line
resetButton.addEventListener('click', function() {
    document.getElementById('categorySelect').value = 'All';
    document.getElementById('subcategorySelect').value = 'All';
    displayGallery();
});
galleryContainer.insertBefore(resetButton, galleryContainer.firstChild);

let timeout = null;

function liveSearch() {
    clearTimeout(timeout);

    const input = document.getElementById("myInput");
    const filter = input.value.toUpperCase();
    const gallery = document.getElementById('csvGallery');
    const cards = gallery.getElementsByClassName('card');

    for (let i = 0; i < cards.length; i++) {
        let title = cards[i].getElementsByClassName("title");
        let sku = cards[i].getElementsByClassName("sku");
        if (title || sku) {
            let txtValueTitle = title ? title.textContent || title.innerText : '';
            let txtValueSku = sku ? sku.textContent || sku.innerText : '';
            if (txtValueTitle.toUpperCase().indexOf(filter) > -1 || txtValueSku.toUpperCase().indexOf(filter) > -1) {
                cards[i].style.display = "";
            } else {
                cards[i].style.display = "none";
            }
        }       
    }

    timeout = setTimeout(function () {
        input.value = '';
    }, 1500); // Clear the input field 2 seconds after the user stops typing
}

function createContentDiv(dataRowItems) {
    const contentDiv = document.createElement('div');
    contentDiv.style.display = 'flex';
    contentDiv.style.flexDirection = 'column';
    let img, title, sku, quantity;
    dataRowItems.forEach((cell, cellIndex) => {
        if (items[cellIndex] === 'Title') {
            title = createParagraph(cell, cellIndex, dataRowItems);
            title.classList.add('title');
        } else if (['SKU', 'ID'].includes(items[cellIndex])) {
            sku = createParagraph(cell, cellIndex, dataRowItems);
            sku.classList.add('sku');
        } else if (items[cellIndex] === 'Quantity') {
            quantity = createParagraph(cell, cellIndex, dataRowItems);
            quantity.classList.add('quantity');
        } else if (cellIndex === 0) {
            img = createImage(cell);
        }
    });
    contentDiv.appendChild(img);
    contentDiv.appendChild(title);
    contentDiv.appendChild(quantity);
    contentDiv.appendChild(sku);
    return contentDiv;
}

// Get the modal
var modal = document.getElementById("myModal");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close");

// Function to open the modal
function openModal(content) {
    var modalBody = document.getElementById("modalBody");
    modalBody.innerHTML = content;
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Modify the createCard function to add an event listener for opening the modal
function createCard(dataRowItems) {
    const card = document.createElement('div');
    card.classList.add('card');
    const contentDiv = createContentDiv(dataRowItems);
    card.appendChild(contentDiv);

