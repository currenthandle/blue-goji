var dropdownLink = document.getElementById('dropdown-link')

dropdownLink.onclick = function () {
	var dropdownMenu = document.getElementById('dropdown-menu')
	console.log('dropdownMenu', dropdownMenu)
	if (dropdownMenu.style.display === 'none') {
		dropdownMenu.style.display = 'inline-block'
	} else {
		dropdownMenu.style.display = 'none'
	}
}
