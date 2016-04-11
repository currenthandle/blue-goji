var dropdown = document.getElementById('dropdownLi')
document.getElementById('dropdown-ul').style.display='none'

dropdown.onclick = function () {
	var dropdownUl = document.getElementById('dropdown-ul')
	if (dropdownUl.style.display === 'none') {
		dropdownUl.style.display = 'inline-block'
	} else {
		dropdownUl.style.display = 'none'
	}
}
