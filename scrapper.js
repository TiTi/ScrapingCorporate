var app_settings =
{
	domain: 'X.X.X.X',
	https: false,
	port: 1340,
	max_search_results: 10,
	cache: 'cache/'
};

var fs = require('fs');
fs.mkdir(app_settings.cache+'companies/', { recursive: true }, (err) =>
{
	if (err)
	{
		console.error("Unable to create cache folder");
	}
});

var linkedin_infos =
{
	scope: ['r_basicprofile'/*, 'r_fullprofile', 'r_emailaddress', 'r_network', 'r_contactinfo', 'rw_nus', 'rw_groups', 'w_messages'*/],
	appId: fs.readFileSync('appId.txt').toString().trim(),
	secret: fs.readFileSync('secret.txt').toString().trim(),
	callbackUrl: (app_settings.https?'https':'http')+'://'+app_settings.domain+':'+app_settings.port+'/oauth/linkedin/callback'
};

var Linkedin  = require('node-linkedin')(linkedin_infos.appId, linkedin_infos.secret, linkedin_infos.callbackUrl);
var linkedin = null;

var express = require('express');
var app = express();

app.use(express.static('public'));

app.get('/', function(req, res)
{
	res.send('Hello, it is ' + new Date() + '<br/><a href="/oauth/linkedin">Connect</a>');
});

app.get('/search', function(req, res)
{
	if (!linkedin)
	{
		return res.status(401).send('Not authenticated');
	}
	var searchTerm = req.query.company;
	console.log("Searching: " + searchTerm);
	linkedin.companies_search.name(searchTerm, app_settings.max_search_results, function(err, result)
	{
		var companies = [];
		if (result.companies.values)
		{
			for (var i = 0; i < result.companies.values.length; ++i)
			{
				var company = result.companies.values[i];
				//fs.writeFileSync(app_settings.cache+'companies/'+company.id+".json", JSON.stringify(company));

				var companySummary =
				{
					name: company.name,
					description: company.description || "",
					locations: company.locations ? company.locations.values : [],
					logoUrl: company.logoUrl,
					websiteUrl: company.websiteUrl ? (company.websiteUrl.indexOf("http") === 0 ? company.websiteUrl : "http://"+company.websiteUrl) : "",
					foundedYear: company.foundedYear,
					numFollowers: company.numFollowers
				};
				if (company.employeeCountRange)
				{
					companySummary.employeeCountRange = company.employeeCountRange.name;
				}
				companies.push(companySummary);
			}
		}
		res.send(JSON.stringify(companies));
	});
});

app.get('/oauth/linkedin/callback', function(req, res)
{
	if (req.query.error)
	{
		// "user_cancelled_login" or "user_cancelled_authorize"
		console.log(req.query.error);
		return res.redirect('/');
	}
	Linkedin.auth.getAccessToken(res, req.query.code, req.query.state, function(err, results)
	{
		if (err)
		{
			return console.error(err);
		}

		linkedin = Linkedin.init(results.access_token,
		{
			timeout: 10000 /* 10 seconds */
		});

		return res.redirect('/demo.html');
	});
});

app.get('/oauth/linkedin', function(req, res)
{
	// This will ask for permisssions etc and redirect to callback url.
	Linkedin.auth.authorize(res, linkedin_infos.scope);
});

app.listen(app_settings.port, function ()
{
	console.log('Listening on port '+app_settings.port);
});
