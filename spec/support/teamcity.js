const { TeamCityReporter } = require('jasmine-reporters');
jasmine.getEnv().addReporter(new TeamCityReporter());