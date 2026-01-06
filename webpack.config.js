const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');
const fs = require('fs');
const path = require('path');

/**
 * Custom webpack configuration to load environment variables from .env files.
 * The appropriate .env file is selected based on the ENV environment variable.
 * 
 * Note: @shared/dto CommonJS modules are handled via allowedCommonJsDependencies
 * in angular.json to eliminate optimization warnings while still bundling them.
 */
module.exports = (config, options) => {
  // Determine which .env file to load based on environment
  const envFile = process.env.ENV === 'prod' 
    ? '.env.prod' 
    : process.env.ENV === 'test' 
    ? '.env.test' 
    : '.env.development';

  // Read the .env file manually to get the values for DefinePlugin
  const envPath = path.resolve(process.cwd(), envFile);
  const envVars = {};
  
  try {
    if (fs.existsSync(envPath)) {
      // Read file and handle different encodings
      let envContent;
      try {
        // Try UTF-8 first
        envContent = fs.readFileSync(envPath, 'utf8');
      } catch (e) {
        // If UTF-8 fails, try reading as buffer and converting
        const buffer = fs.readFileSync(envPath);
        // Check for UTF-16 BOM (FE FF or FF FE)
        if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
          // UTF-16 BE
          envContent = buffer.toString('utf16le');
        } else if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
          // UTF-16 LE
          envContent = buffer.toString('utf16le');
        } else {
          // Try UTF-8
          envContent = buffer.toString('utf8');
        }
      }
      
      // Remove BOM if present
      envContent = envContent.replace(/^\uFEFF/, '');
      
      envContent.split(/\r?\n/).forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const equalIndex = trimmedLine.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmedLine.substring(0, equalIndex).trim();
            const value = trimmedLine.substring(equalIndex + 1).trim();
            // Remove quotes if present
            envVars[key] = value.replace(/^["']|["']$/g, '');
          }
        }
      });
      console.log(`[Webpack Config] Loaded ${Object.keys(envVars).length} variables from ${envFile}`);
      console.log(`[Webpack Config] Variables:`, envVars);
    } else {
      console.warn(`[Webpack Config] Environment file ${envFile} not found at ${envPath}`);
    }
  } catch (error) {
    console.error(`[Webpack Config] Error reading ${envFile}:`, error);
  }

  // Initialize plugins array if needed
  if (!config.plugins) {
    config.plugins = [];
  }

  // Add Dotenv plugin (this should work but we'll also use DefinePlugin as backup)
  config.plugins.push(
    new Dotenv({
      path: envFile,
      safe: false,
      systemvars: true,
      silent: false,
      defaults: false,
      expand: true
    })
  );

  // Use DefinePlugin to explicitly define the variables
  // This is the most reliable way to ensure webpack replaces process.env.VARIABLE_NAME
  const definePluginVars = {};
  Object.keys(envVars).forEach((key) => {
    // DefinePlugin needs JSON.stringify to create a string literal in the code
    // This will replace process.env.KEY with "value" in the bundled code
    definePluginVars[`process.env.${key}`] = JSON.stringify(envVars[key]);
  });
  
  if (Object.keys(definePluginVars).length > 0) {
    config.plugins.push(
      new webpack.DefinePlugin(definePluginVars)
    );
    console.log(`[Webpack Config] Added DefinePlugin with ${Object.keys(definePluginVars).length} variables`);
    console.log(`[Webpack Config] DefinePlugin will replace:`, Object.keys(definePluginVars));
  } else {
    console.warn(`[Webpack Config] No environment variables to define`);
  }

  // Note: @shared/dto CommonJS modules are handled via allowedCommonJsDependencies in angular.json
  // This allows webpack to bundle them without optimization warnings

  return config;
};

