import webresource as wr


resources = wr.ResourceGroup(
    name='treibstoff',
    directory='./bundle',
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


###############################################################################
# pyramid static view creation if installed
###############################################################################

try:
    from pyramid.static import static_view
    PYRAMID_INSTALLED = True
except ImportError:
    PYRAMID_INSTALLED = False

if PYRAMID_INSTALLED:
    static = static_view('bundle', use_subpath=True)
