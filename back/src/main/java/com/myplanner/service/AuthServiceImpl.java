package com.myplanner.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.myplanner.common.BusinessException;
import com.myplanner.common.ResultCode;
import com.myplanner.entity.SysUser;
import com.myplanner.mapper.SysUserMapper;
import com.myplanner.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_]{4,20}$");
    private static final Pattern HAS_LETTER = Pattern.compile("[a-zA-Z]");
    private static final Pattern HAS_DIGIT = Pattern.compile("[0-9]");

    private final SysUserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(SysUserMapper userMapper, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void register(String username, String password) {
        if (username == null || !USERNAME_PATTERN.matcher(username).matches()) {
            throw new BusinessException(400, "用户名必须为4-20位字母、数字或下划线");
        }

        if (password == null || password.length() < 8 || password.length() > 20) {
            throw new BusinessException(400, "密码长度必须为8-20位");
        }
        if (!HAS_LETTER.matcher(password).find() || !HAS_DIGIT.matcher(password).find()) {
            throw new BusinessException(400, "密码必须包含字母和数字");
        }

        String lowerUsername = username.toLowerCase();

        Long count = userMapper.selectCount(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, lowerUsername));
        if (count > 0) {
            throw new BusinessException(ResultCode.CONFLICT);
        }

        SysUser user = new SysUser();
        user.setUsername(lowerUsername);
        user.setPassword(passwordEncoder.encode(password));
        userMapper.insert(user);
    }

    @Override
    public String login(String username, String password) {
        if (username == null || password == null) {
            throw new BusinessException(400, "用户名和密码不能为空");
        }

        SysUser user = userMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username.toLowerCase()));
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException(400, "用户名或密码错误");
        }

        return jwtUtil.generateToken(user.getId());
    }
}
