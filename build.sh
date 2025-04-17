# Go to the frontend directory
cd ~/flavorfindr/frontend

# Install dependencies if you haven't already or they changed
npm install

# Run the build process (defined in package.json, typically uses Vite)
npm run build

# Verify the build output directory exists (usually 'dist')
ls -l
# You should see a 'dist' directory listed here
#
# # Ensure the Apache user (daemon) can access the project directory & build output
# Set ownership to bitnami user and daemon group (Apache's group)
sudo chown -R bitnami:daemon ~/flavorfindr/frontend/dist

# Set appropriate permissions:
# Directories need execute permission (755 = rwxr-xr-x)
# sudo find ~/flavorfindr -type d -exec chmod 755 {} \;
# Files need read permission (644 = rw-r--r--)
# sudo find ~/flavorfindr/frontend/dist -type f -exec chmod 644 {}


sudo /opt/bitnami/ctlscript.sh restart apache
