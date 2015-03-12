Mama Meets
==========


## Project overview

The server-side code lay in `server/`;
The client-side code layout is restricted to Ionic, mainly lays in `www/`.

## System requirements

```bash
$ apt-get install \
        build-essential python3-dev \
        uwsgi-plugin-python3 \
        libjpeg-dev

$ pip install virtualenvwrapper
```

## Config&Setup


```bash
$ adduser mama

$ mkdir ~/venvs/meets
```

Edit `~/.bashrc`, and append:

```bash
export WORKON_HOME=~/venvs
virtualenvwrapper=/usr/local/bin/virtualenvwrapper.sh
[ -d "$WORKON_HOME" ] || mkdir -p $WORKON_HOME
[ -f "$virtualenvwrapper" ] && source "$virtualenvwrapper"
```

```bash
mkvirtualenv --python=`which python3` meets
```

Prepare remote deploy location:

```
cd ~
git init --bare meets.git
git init meets
cd meets
git remote add deploy file:///home/mama/meets.git


# static root dir
$ sudo mkdir /var/meets
$ sudo chown -R mama:mama /var/meets

$ mkdir -p ~/data/meets
$ mkdir -p ~/data/meets/media/images/product
```


## Get involved with ionic app

```bash

npm install -g cordova ionic gulp

ionic setup sass

ionic serve

```


## Extra notes

Login to SessionAuthentication with csrftoken:

```bash
http -f post http://localhost:8000/api-auth/login/ \
    'Cookie:csrftoken=ytRaxmvdCairaSNvFdpMDZSxtkAWBmkg' \
    X-CSRFToken:ytRaxmvdCairaSNvFdpMDZSxtkAWBmkg \
    username=wonder password=wx \
    #csrfmiddlewaretoken=ytRaxmvdCairaSNvFdpMDZSxtkAWBmkg
```

Login to TokenAuthentication with token:

```bash
http patch http://localhost:8000/api/products/1/ 'Authorization: Token c60458f0f05ff522f20855b3a6c4388216c431b5'
```

Obtain user's token by username&password:

```bash
http post http://localhost:8000/api-token-auth/ username=wonder password=wx
```

## Install custom ionicons

requirements:

$ sudo apt-get install fontforge ttfautohint woff-tools
$ sudo gem install sass

copy ionicons files from custom project:

cp ~/git/ionicons/scss/*.scss www/lib/ionic/scss/ionicons/
cp ~/git/ionicons/fonts/ionicons.* www/lib/ionic/fonts/
