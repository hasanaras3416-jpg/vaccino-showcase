"""STEP → ham GLB (cascadio çekirdeği; numpy gerektiren yardımcı modüller yüklenmez).
Kullanım: python -I step2glb.py <girdi.step> <çıktı.glb> <tol_linear_mm> <tol_angular_rad>"""
import importlib.machinery, importlib.util, os, sys

site = os.path.join(os.path.dirname(sys.executable), '..', 'Lib', 'site-packages')
libs = os.path.abspath(os.path.join(site, 'cascadio.libs'))
if os.path.isdir(libs):
    os.add_dll_directory(libs)
core_path = os.path.join(site, 'cascadio', '_core.cp310-win_amd64.pyd')
loader = importlib.machinery.ExtensionFileLoader('_core', core_path)
spec = importlib.util.spec_from_file_location('_core', core_path, loader=loader)
core = importlib.util.module_from_spec(spec); loader.exec_module(core)

src, dst, tol_lin, tol_ang = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
rc = core.step_to_glb(src, dst, tol_linear=tol_lin, tol_angular=tol_ang, tol_relative=False,
                      merge_primitives=False, use_parallel=True, include_brep=False, include_materials=False)
print('cascadio', core.__version__, 'rc', rc, 'bytes', os.path.getsize(dst))
