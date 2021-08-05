import webresource as wr


treibstoff_js = wr.ScriptResource(
    name='treibstoff_js',
    depends='jquery_js',
    directory='./bundle',
    resource='treibstoff.bundle.js',
    compressed='treibstoff.bundle.min.js'
)

treibstoff_css = wr.StyleResource(
    name='treibstoff_css',
    depends='bootstrap_css',
    directory='./bundle',
    resource='treibstoff.css'
)


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
