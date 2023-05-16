from setuptools import find_packages
from setuptools import setup
import os


def read_file(name):
    with open(os.path.join(os.path.dirname(__file__), name)) as f:
        return f.read()


version = '0.2.0'
shortdesc = (
    'A set of useful javascript tools for writing browser '
    'based applications (or parts of it).'
)
longdesc = '\n\n'.join([read_file(name) for name in [
    'README.rst',
    'CHANGES.rst',
    'LICENSE.rst'
]])


setup(
    name='treibstoff',
    version=version,
    description=shortdesc,
    long_description=longdesc,
    classifiers=[
        'Environment :: Web Environment',
        'Operating System :: OS Independent',
        'Programming Language :: JavaScript',
        'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
    ],
    keywords='',
    author='Conestack Contributors',
    author_email='dev@conestack.org',
    url=u'https://github.com/conestack/treibstoff',
    license='Simplified BSD',
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        'setuptools',
        'webresource'
    ],
    extras_require=dict(
        docs=[
            'Jinja2<3.0',
            'markupsafe<2.1.0',
            'Sphinx',
            'sphinx-conestack-theme',
            'sphinx_js'
        ]
    )
)
