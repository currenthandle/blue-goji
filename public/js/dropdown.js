var dropdown = document.getElementById('dropdownLi')
document.getElementById('dropdown-ul').style.display='none'

dropdown.onclick = function () {
	var dropdownUl = document.getElementById('dropdown-ul')
	var dropdownIcon = document.getElementById('dropdown-icon')
	if (dropdownUl.style.display === 'none') {
		dropdownUl.style.display = 'inline-block'
		dropdownIcon.style.color = '#5ac40f'
	} else {
		dropdownUl.style.display = 'none'
		dropdownIcon.style.color = '#0eb5fe'
	}
}
