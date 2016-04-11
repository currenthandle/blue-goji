var dropdown = document.getElementById('dropdownLi')

dropdown.onclick = function () {
	var dropdownUl = document.getElementById('dropdown-ul')
	if (dropdownUl.style.display === 'none') {
		dropdownUl.style.display = 'inline-block'
	} else {
		dropdownUl.style.display = 'none'
	}
}
