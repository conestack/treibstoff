import os
import webresource as wr


resources_dir = os.path.join(os.path.dirname(__file__), 'bundle')
resources = wr.ResourceGroup(
    name='treibstoff',
    directory=resources_dir,
    path='treibstoff'
)
resources.add(wr.ScriptResource(
    name='treibstoff-js',
    depends='jquery-js',
    resource='treibstoff.bundle.js',
    compressed='treibstoff.bundle.min.js'
))
resources.add(wr.StyleResource(
    name='treibstoff-css',
    depends='bootstrap-css',
    resource='treibstoff.css'
))
