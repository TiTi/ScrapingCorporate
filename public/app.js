
var searchTimer = null;
document.getElementById("search").addEventListener("keydown", function()
{
	clearTimeout(searchTimer);
	searchTimer = setTimeout(search.bind(this), 200);
});

function search()
{
	console.log('Searching: ' + this.value);

	var params = "?company="+encodeURIComponent(this.value);

	fetch('/search'+params)
		.then(response =>
		{
			if (response.status == 401)
			{
				window.location.pathname = "/";
				return;
			}
			else if(response.status != 200)
			{
				var err = new Error(response.statusText)
				err.response = response.text();
				throw err;
			}
			return response.json()
		})
		.then(displaySearchResults)
		.catch(function(ex)
		{
			console.error(ex);
			document.getElementById("results").innerHTML = "An error occurred, please retry";
		});
	document.getElementById("results").innerHTML = "Loading...";
}

function displaySearchResults(companies)
{
	var rows = [];
	for (var i = 0; i < companies.length; ++i)
	{
		var company = companies[i];
		var logo = company.logoUrl ? `<img src="${company.logoUrl}" width="150" />` : '';
		var founded = company.foundedYear ? `Founded: ${company.foundedYear}` : '';
		var count = company.employeeCountRange ? `Count: ${company.employeeCountRange}` : '';
		var followers = company.numFollowers ? "Followers: "+company.numFollowers : '';
		var block = `
		<tr>
			<td>${logo}</td>
			<td class="company">${company.name}</td>
			<td><a href="${company.websiteUrl}">${company.websiteUrl}</a><br />${founded}<br />${count}<br />${followers}</td>
			<td class="desc">${company.description}</td>
		<tr>`;
		rows.push(block);
	}
	document.getElementById("results").innerHTML = '<table id="companies"><tbody>'+rows.join("")+'</tbody></table>';
}